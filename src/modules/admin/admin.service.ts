import { Prisma, UserRole } from '@prisma/client';
import prisma from '../../common/database/prisma';
import { AppError } from '../../common/middleware/errorHandler';
import { PaymentService } from '../payments/payment.service';
import { logger } from '../../common/utils/logger';

export class AdminService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async getDashboard() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      totalRevenue,
      pendingVerifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.doctor.count({
        where: { isVerified: false },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        doctors: totalDoctors,
        patients: totalPatients,
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      verifications: {
        pending: pendingVerifications,
      },
    };
  }

  async getUsers(filters: any) {
    const { role, isActive, search, page = 1, limit = 10 } = filters;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { doctor: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          doctor: true,
          patient: true,
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    logger.info(`User status updated: ${userId} to ${isActive}`);

    return user;
  }

  async getAnalytics(period: string = '7d') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      newUsers,
      newAppointments,
      revenue,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.appointment.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.appointment.count({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      period,
      newUsers,
      newAppointments,
      revenue: revenue._sum.amount || 0,
      completedAppointments,
      cancelledAppointments,
    };
  }

  async getAuditLogs(filters: any) {
    const { action, entity, userId, page = 1, limit = 10 } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getRefunds(filters: any) {
    const { status, page = 1, limit = 10 } = filters;

    const where: Prisma.PaymentWhereInput = {
      status: { in: ['REFUNDED', 'FAILED'] },
    };

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          appointment: {
            include: {
              doctor: true,
              patient: true,
            },
          },
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async processRefund(paymentId: string) {
    const result = await this.paymentService.refundPayment(paymentId);
    logger.info(`Refund processed by admin: ${paymentId}`);
    return result;
  }
}
