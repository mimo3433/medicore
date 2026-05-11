import { addDays, parseISO } from 'date-fns';
import prisma from '../../common/database/prisma';
import redis, { cacheKeys } from '../../common/database/redis';
import { AppError } from '../../common/middleware/errorHandler';
import { logger } from '../../common/utils/logger';
import { SlotStatus } from '@prisma/client';

export class ScheduleService {
  async createSchedule(userId: string, data: any) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    // Check for overlapping schedules
    const existingSchedule = await prisma.schedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctor.id,
          dayOfWeek: data.dayOfWeek,
        },
      },
    });

    if (existingSchedule) {
      throw new AppError('Schedule already exists for this day', 409);
    }

    const schedule = await prisma.schedule.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration || 30,
      },
    });

    logger.info(`Schedule created: ${schedule.id}`);

    return schedule;
  }

  async updateSchedule(scheduleId: string, userId: string, data: any) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        doctor: { userId },
      },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration,
        isActive: data.isActive,
      },
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(schedule.doctorId));

    logger.info(`Schedule updated: ${scheduleId}`);

    return updated;
  }

  async deleteSchedule(scheduleId: string, userId: string) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        doctor: { userId },
      },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isActive: false },
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(schedule.doctorId));

    logger.info(`Schedule deleted: ${scheduleId}`);
  }

  async getSchedules(userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    const schedules = await prisma.schedule.findMany({
      where: { doctorId: doctor.id, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    return schedules;
  }

  async generateSlots(scheduleId: string, startDate: string, endDate: string) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { doctor: true },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Collect all matching dates first
    const datesToProcess: Date[] = [];
    for (let date = start; date <= end; date = addDays(date, 1)) {
      if (date.getDay() === schedule.dayOfWeek) {
        datesToProcess.push(new Date(date));
      }
    }

    if (datesToProcess.length === 0) {
      return { count: 0, slots: [], matchedDays: 0 };
    }

    // Batch fetch blocked dates and existing slots in 2 queries instead of N+1
    const blockedDates = await prisma.unavailableDate.findMany({
      where: {
        doctorId: schedule.doctorId,
        date: { in: datesToProcess },
      },
      select: { date: true },
    });
    const blockedSet = new Set(blockedDates.map(b => b.date.toISOString().split('T')[0]));

    const existingSlots = await prisma.appointmentSlot.findMany({
      where: {
        doctorId: schedule.doctorId,
        date: { in: datesToProcess },
      },
      select: { date: true, startTime: true },
    });
    const existingSet = new Set(existingSlots.map(s => `${s.date.toISOString().split('T')[0]}|${s.startTime}`));

    const slots = [];
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (const date of datesToProcess) {
      const dateKey = date.toISOString().split('T')[0];
      if (blockedSet.has(dateKey)) continue;

      let currentMinutes = startMinutes;
      while (currentMinutes + schedule.slotDuration <= endMinutes) {
        const slotStart = currentMinutes;
        const slotEnd = currentMinutes + schedule.slotDuration;
        const startTimeStr = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
        const endTimeStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

        if (!existingSet.has(`${dateKey}|${startTimeStr}`)) {
          slots.push({
            doctorId: schedule.doctorId,
            scheduleId: schedule.id,
            date,
            startTime: startTimeStr,
            endTime: endTimeStr,
            status: SlotStatus.AVAILABLE,
          });
        }
        currentMinutes += schedule.slotDuration;
      }
    }

    const createdSlots = await prisma.appointmentSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });

    await redis.del(cacheKeys.doctorSlots(schedule.doctorId, startDate));
    await redis.del(cacheKeys.doctorSlots(schedule.doctorId, endDate));

    logger.info(`Generated ${createdSlots.count} slots for schedule: ${scheduleId}`);

    return {
      count: createdSlots.count,
      matchedDays: datesToProcess.length,
      slots: slots.slice(0, 10), // Return first 10 for preview
    };
  }

  async blockDate(userId: string, data: any) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    const blockedDate = await prisma.unavailableDate.create({
      data: {
        doctorId: doctor.id,
        date: new Date(data.date),
        reason: data.reason,
      },
    });

    // Delete existing slots for this date
    await prisma.appointmentSlot.deleteMany({
      where: {
        doctorId: doctor.id,
        date: new Date(data.date),
        status: 'AVAILABLE',
      },
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(doctor.id));

    logger.info(`Date blocked: ${data.date} for doctor: ${doctor.id}`);

    return blockedDate;
  }

  async unblockDate(blockId: string, userId: string) {
    const blockedDate = await prisma.unavailableDate.findFirst({
      where: {
        id: blockId,
        doctor: { userId },
      },
    });

    if (!blockedDate) {
      throw new AppError('Blocked date not found', 404);
    }

    await prisma.unavailableDate.delete({
      where: { id: blockId },
    });

    // Regenerate slots for this date
    const schedule = await prisma.schedule.findFirst({
      where: {
        doctorId: blockedDate.doctorId,
        dayOfWeek: blockedDate.date.getDay(),
        isActive: true,
      },
    });

    if (schedule) {
      await this.generateSlots(schedule.id, blockedDate.date.toISOString(), blockedDate.date.toISOString());
    }

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(blockedDate.doctorId));

    logger.info(`Date unblocked: ${blockedDate.date}`);
  }

  async getAvailableSlots(doctorId: string, date: string) {
    console.log('getAvailableSlots called with:', { doctorId, date });

    const cacheKey = cacheKeys.doctorSlots(doctorId, date);
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log('Returning cached slots');
      return JSON.parse(cached);
    }

    // Use date range to handle timezone issues
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Querying slots between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    const slots = await prisma.appointmentSlot.findMany({
      where: {
        doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    console.log('Found slots:', slots.length);

    await redis.setex(cacheKey, 300, JSON.stringify(slots));

    return slots;
  }
}
