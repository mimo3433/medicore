import { NotificationType, NotificationChannel } from '@prisma/client';
import prisma from '../../common/database/prisma';
import { config } from '../../common/config';
import { logger } from '../../common/utils/logger';
import nodemailer from 'nodemailer';

// Email transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
    title: string,
    message: string,
    metadata?: any
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        title,
        message,
        metadata: metadata as any,
      },
    });

    logger.info(`Notification created: ${notification.id} for user: ${userId}`);

    return notification;
  }

  async sendBookingConfirmation(patientId: string, appointmentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) return;

    await this.createNotification(
      patient.userId,
      NotificationType.BOOKING_CONFIRMED,
      NotificationChannel.IN_APP,
      'Appointment Booked',
      `Your appointment has been booked successfully.`,
      { appointmentId }
    );

    // Send email
    await this.sendEmail(
      patient.user.email,
      'Appointment Booked Successfully',
      `Your appointment has been booked successfully.`
    );
  }

  async sendAppointmentReminder(patientId: string, appointmentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) return;

    await this.createNotification(
      patient.userId,
      NotificationType.APPOINTMENT_REMINDER,
      NotificationChannel.IN_APP,
      'Appointment Reminder',
      `You have an appointment coming up soon.`,
      { appointmentId }
    );

    // Send email
    await this.sendEmail(
      patient.user.email,
      'Appointment Reminder',
      `You have an appointment coming up soon.`
    );
  }

  async sendCancellationNotification(patientId: string, appointmentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) return;

    await this.createNotification(
      patient.userId,
      NotificationType.CANCELLATION,
      NotificationChannel.IN_APP,
      'Appointment Cancelled',
      `Your appointment has been cancelled.`,
      { appointmentId }
    );

    // Send email
    await this.sendEmail(
      patient.user.email,
      'Appointment Cancelled',
      `Your appointment has been cancelled.`
    );
  }

  async sendReschedulingNotification(patientId: string, appointmentId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) return;

    await this.createNotification(
      patient.userId,
      NotificationType.RESCHEDULING,
      NotificationChannel.IN_APP,
      'Appointment Rescheduled',
      `Your appointment has been rescheduled.`,
      { appointmentId }
    );

    // Send email
    await this.sendEmail(
      patient.user.email,
      'Appointment Rescheduled',
      `Your appointment has been rescheduled.`
    );
  }

  async sendPaymentSuccessNotification(userId: string, paymentId: string) {
    await this.createNotification(
      userId,
      NotificationType.PAYMENT_SUCCESS,
      NotificationChannel.IN_APP,
      'Payment Successful',
      `Your payment has been processed successfully.`,
      { paymentId }
    );

    // Send email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.sendEmail(
        user.email,
        'Payment Successful',
        `Your payment has been processed successfully.`
      );
    }
  }

  async sendPaymentFailedNotification(userId: string, paymentId: string) {
    await this.createNotification(
      userId,
      NotificationType.PAYMENT_FAILED,
      NotificationChannel.IN_APP,
      'Payment Failed',
      `Your payment could not be processed.`,
      { paymentId }
    );

    // Send email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.sendEmail(
        user.email,
        'Payment Failed',
        `Your payment could not be processed. Please try again.`
      );
    }
  }

  async getUserNotifications(userId: string, filters: any) {
    const { isRead, page = 1, limit = 10 } = filters;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  private async sendEmail(to: string, subject: string, text: string) {
    try {
      await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        text,
        html: `<p>${text}</p>`,
      });
      logger.info(`Email sent to: ${to}`);
    } catch (error) {
      logger.error('Email sending error:', error);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${config.frontend.url}/verify-email?token=${token}`;
    
    await this.sendEmail(
      email,
      'Verify Your Email',
      `Please verify your email by clicking the following link: ${verificationUrl}`
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.frontend.url}/reset-password?token=${token}`;
    
    await this.sendEmail(
      email,
      'Reset Your Password',
      `Please reset your password by clicking the following link: ${resetUrl}`
    );
  }
}
