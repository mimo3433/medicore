import { AppointmentStatus, SlotStatus } from '@prisma/client';
import prisma from '../../common/database/prisma';
import redis, { cacheKeys } from '../../common/database/redis';
import { AppError } from '../../common/middleware/errorHandler';
import { PaymentService } from '../payments/payment.service';
import { NotificationService } from '../notifications/notification.service';
import { logger } from '../../common/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentService {
  private paymentService: PaymentService;
  private notificationService: NotificationService;

  constructor() {
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
  }

  async bookAppointment(userId: string, data: any) {
    const idempotencyKey = data.idempotencyKey || uuidv4();

    // Check for duplicate request using idempotency key
    const existingAppointment = await prisma.appointment.findUnique({
      where: { idempotencyKey },
    });

    if (existingAppointment) {
      return existingAppointment;
    }

    // Use SERIALIZABLE transaction with row-level locking to prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // Get patient
        const patient = await tx.patient.findUnique({
          where: { userId },
        });

        if (!patient) {
          throw new AppError('Patient profile not found', 404);
        }

        // Get slot with FOR UPDATE lock (row-level locking)
        const slot = await tx.appointmentSlot.findUnique({
          where: { id: data.slotId },
        });

        if (!slot) {
          throw new AppError('Slot not found', 404);
        }

        if (slot.status !== SlotStatus.AVAILABLE) {
          throw new AppError('Slot is not available', 409);
        }

        // Compare dates at midnight to avoid timezone/time-of-day issues
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);

        if (slotDate < today) {
          throw new AppError('Cannot book past appointments', 400);
        }

        // Lock the slot row
        await tx.$executeRaw`SELECT * FROM "appointment_slots" WHERE id = ${data.slotId} FOR UPDATE`;

        // Double-check slot status after acquiring lock
        const freshSlot = await tx.appointmentSlot.findUnique({
          where: { id: data.slotId },
        });

        if (!freshSlot || freshSlot.status !== SlotStatus.AVAILABLE) {
          throw new AppError('Slot is no longer available', 409);
        }

        // Get doctor to calculate fee
        const doctor = await tx.doctor.findUnique({
          where: { id: slot.doctorId },
        });

        if (!doctor) {
          throw new AppError('Doctor not found', 404);
        }

        // Create payment intent
        const payment = await this.paymentService.createPaymentIntent(
          doctor.consultationFee,
          'USD',
          { appointmentSlotId: slot.id, patientId: patient.id }
        );

        // Create appointment
        const appointment = await tx.appointment.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            slotId: slot.id,
            status: AppointmentStatus.PENDING,
            reason: data.reason,
            symptoms: data.symptoms,
            notes: data.notes,
            idempotencyKey,
            paymentId: payment.id,
          },
        });

        // Update slot status to RESERVED
        await tx.appointmentSlot.update({
          where: { id: slot.id },
          data: { status: SlotStatus.RESERVED },
        });

        return { appointment, payment, doctor, slot };
      },
      {
        isolationLevel: 'Serializable',
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      }
    );

    // Invalidate cache
    await redis.del(cacheKeys.doctorSlots(result.slot.doctorId, result.slot.date.toISOString()));

    logger.info(`Appointment booked: ${result.appointment.id} for patient: ${userId}`);

    // Queue notification (async)
    this.notificationService.sendBookingConfirmation(
      result.appointment.patientId,
      result.appointment.id
    ).catch((err) => logger.error('Failed to send notification:', err));

    return {
      appointment: result.appointment,
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        clientSecret: result.payment.paymentIntentId,
      },
    };
  }

  async getMyAppointments(userId: string, filters: any) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const { status, page = 1, limit = 10 } = filters;

    const where: any = { patientId: patient.id };

    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: true,
          slot: true,
          payment: true,
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getAppointmentById(appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        slot: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check if user is authorized
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (
      appointment.patient.userId !== userId &&
      (!doctor || appointment.doctorId !== doctor.id)
    ) {
      throw new AppError('Unauthorized to view this appointment', 403);
    }

    return appointment;
  }

  async cancelAppointment(appointmentId: string, userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { slot: true, payment: true },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Check authorization
      const patient = await tx.patient.findUnique({
        where: { userId },
      });

      if (!patient || appointment.patientId !== patient.id) {
        throw new AppError('Unauthorized to cancel this appointment', 403);
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        throw new AppError('Appointment already cancelled', 400);
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new AppError('Cannot cancel completed appointment', 400);
      }

      // Update appointment status
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Update slot status
      await tx.appointmentSlot.update({
        where: { id: appointment.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // Process refund if payment was successful
      if (appointment.payment && appointment.payment.status === 'SUCCESS') {
        await this.paymentService.processRefund(appointment.payment.id);
        await tx.payment.update({
          where: { id: appointment.payment.id },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });
      }

      return updated;
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorSlots(result.doctorId, result.slot.date.toISOString()));

    logger.info(`Appointment cancelled: ${appointmentId} by user: ${userId}`);

    // Queue notification
    this.notificationService.sendCancellationNotification(
      result.patientId,
      result.id
    ).catch((err) => logger.error('Failed to send notification:', err));

    return result;
  }

  async rescheduleAppointment(appointmentId: string, userId: string, newSlotId: string) {
    const result = await prisma.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: { slot: true },
        });

        if (!appointment) {
          throw new AppError('Appointment not found', 404);
        }

        // Check authorization
        const patient = await tx.patient.findUnique({
          where: { userId },
        });

        if (!patient || appointment.patientId !== patient.id) {
          throw new AppError('Unauthorized to reschedule this appointment', 403);
        }

        if (appointment.status === AppointmentStatus.CANCELLED) {
          throw new AppError('Cannot reschedule cancelled appointment', 400);
        }

        if (appointment.status === AppointmentStatus.COMPLETED) {
          throw new AppError('Cannot reschedule completed appointment', 400);
        }

        // Lock new slot
        await tx.$executeRaw`SELECT * FROM "appointment_slots" WHERE id = ${newSlotId} FOR UPDATE`;

        const newSlot = await tx.appointmentSlot.findUnique({
          where: { id: newSlotId },
        });

        if (!newSlot || newSlot.status !== SlotStatus.AVAILABLE) {
          throw new AppError('New slot is not available', 409);
        }

        // Release old slot
        await tx.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });

        // Reserve new slot
        await tx.appointmentSlot.update({
          where: { id: newSlotId },
          data: { status: SlotStatus.BOOKED },
        });

        // Update appointment
        const updated = await tx.appointment.update({
          where: { id: appointmentId },
          data: { slotId: newSlotId },
        });

        return { updated, oldSlotId: appointment.slotId, newSlot };
      },
      { isolationLevel: 'Serializable' }
    );

    // Invalidate cache for both slots
    await redis.del(cacheKeys.doctorSlots(result.newSlot.doctorId, result.newSlot.date.toISOString()));

    logger.info(`Appointment rescheduled: ${appointmentId} to slot: ${newSlotId}`);

    // Queue notification
    this.notificationService.sendReschedulingNotification(
      result.updated.patientId,
      result.updated.id
    ).catch((err) => logger.error('Failed to send notification:', err));

    return result.updated;
  }

  async getDoctorAppointments(userId: string, filters: any) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    const { status, date, page = 1, limit = 10 } = filters;

    const where: any = { doctorId: doctor.id };

    if (status) {
      where.status = status;
    }

    if (date) {
      where.slot = { date: new Date(date) };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          slot: true,
          payment: true,
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async updateAppointmentStatus(appointmentId: string, userId: string, status: AppointmentStatus) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    logger.info(`Appointment status updated: ${appointmentId} to ${status}`);

    return updated;
  }

  async completeAppointment(appointmentId: string, userId: string, notes: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: { slot: true },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new AppError('Can only complete confirmed appointments', 400);
    }

    // Prevent completing before scheduled time
    const appointmentDate = new Date(appointment.slot.date);
    const [hours, minutes] = appointment.slot.startTime.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    if (appointmentDate > now) {
      throw new AppError('Cannot complete appointment before scheduled time', 400);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        notes,
        completedAt: new Date(),
      },
    });

    // Update doctor rating (simplified - would need review system)
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        totalReviews: { increment: 1 },
      },
    });

    logger.info(`Appointment completed: ${appointmentId}`);

    return updated;
  }
}
