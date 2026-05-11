import { Prisma } from '@prisma/client';
import prisma from '../../common/database/prisma';
import redis, { cacheKeys } from '../../common/database/redis';
import { AppError } from '../../common/middleware/errorHandler';
import { logger } from '../../common/utils/logger';

export class DoctorService {
  async getDoctors(filters: any) {
    const {
      search,
      specialization,
      minRating,
      maxRating,
      minFee,
      maxFee,
      language,
      location,
      page = 1,
      limit = 10,
    } = filters;

    const cacheKey = cacheKeys.availableDoctors(JSON.stringify(filters));
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.DoctorWhereInput = {
      isVerified: true,
      user: { isActive: true },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    const ratingFilter: any = {};
    if (minRating !== undefined) ratingFilter.gte = parseFloat(minRating);
    if (maxRating !== undefined) ratingFilter.lte = parseFloat(maxRating);
    if (Object.keys(ratingFilter).length > 0) where.rating = ratingFilter;

    const feeFilter: any = {};
    if (minFee !== undefined) feeFilter.gte = parseFloat(minFee);
    if (maxFee !== undefined) feeFilter.lte = parseFloat(maxFee);
    if (Object.keys(feeFilter).length > 0) where.consultationFee = feeFilter;

    if (language) {
      where.languages = { has: language };
    }

    if (location) {
      where.clinicLocation = { contains: location, mode: 'insensitive' };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          schedules: {
            where: { isActive: true },
          },
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { rating: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    const result = {
      doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async getDoctorById(doctorId: string) {
    const cacheKey = cacheKeys.doctorProfile(doctorId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: { fullName: true },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    await redis.setex(cacheKey, 600, JSON.stringify(doctor));

    return doctor;
  }

  async getDoctorReviews(doctorId: string) {
    const reviews = await prisma.review.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { fullName: true },
        },
      },
    });
    return reviews;
  }

  async createReview(userId: string, doctorId: string, rating: number, comment?: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if patient has a completed appointment with this doctor
    const hasCompletedAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        doctorId,
        status: 'COMPLETED',
      },
    });

    if (!hasCompletedAppointment) {
      throw new AppError('You can only review doctors after a completed appointment', 403);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        patientId: patient.id,
        doctorId,
        rating,
        comment: comment || null,
      },
    });

    // Recalculate doctor rating
    const allReviews = await prisma.review.findMany({
      where: { doctorId },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(doctorId));

    logger.info(`Review created for doctor ${doctorId} by patient ${patient.id}`);

    return review;
  }

  async getMyProfile(userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          },
        },
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        unavailableDates: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    return doctor;
  }

  async updateProfile(userId: string, data: any) {
    const doctor = await prisma.doctor.update({
      where: { userId },
      data: {
        fullName: data.fullName,
        specialization: data.specialization,
        experience: data.experience,
        qualification: data.qualification,
        consultationFee: data.consultationFee,
        consultationDuration: data.consultationDuration,
        bio: data.bio,
        languages: data.languages,
        clinicLocation: data.clinicLocation,
        clinicAddress: data.clinicAddress,
      },
    });

    // Invalidate cache
    await redis.del(cacheKeys.doctorProfile(doctor.id));

    logger.info(`Doctor profile updated: ${doctor.id}`);

    return doctor;
  }

  async uploadDocument(userId: string, documentData: any) {
    // In production, upload to S3/Cloudinary
    const documentUrl = documentData.url || `https://s3.example.com/${documentData.name}`;

    // Store document metadata
    // This would need a documents table in the schema
    logger.info(`Document uploaded for doctor: ${userId}`);

    return { url: documentUrl };
  }

  async getDoctorSchedule(doctorId: string, date?: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        schedules: {
          where: { isActive: true },
        },
        unavailableDates: {
          where: date
            ? { date: new Date(date) }
            : { date: { gte: new Date() } },
        },
      },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    return doctor;
  }

  async verifyDoctor(doctorId: string) {
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        isVerified: true,
        verificationDate: new Date(),
      },
    });

    logger.info(`Doctor verified: ${doctorId}`);

    return doctor;
  }
}
