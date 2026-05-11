import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import prisma from '../../common/database/prisma';
import { config } from '../../common/config';
import { AppError } from '../../common/middleware/errorHandler';
import { logger } from '../../common/utils/logger';
import { AppointmentService } from '../appointments/appointment.service';

const stripe = new Stripe(config.stripe.secretKey);

export class PaymentService {
  async createPaymentIntent(amount: number, currency: string = 'USD', metadata: any = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment record in database
      const payment = await prisma.payment.create({
        data: {
          amount,
          currency: currency.toUpperCase(),
          status: PaymentStatus.INITIATED,
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
          metadata: metadata as any,
        },
      });

      logger.info(`Payment intent created: ${payment.id}`);

      return {
        id: payment.id,
        clientSecret: paymentIntent.client_secret,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation error:', error);
      throw new AppError('Failed to create payment intent', 500);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment in database
        const payment = await prisma.payment.update({
          where: { paymentIntentId },
          data: {
            status: PaymentStatus.SUCCESS,
            transactionId: paymentIntent.id,
          },
        });

        // If this payment is for an appointment, confirm the appointment
        if (payment.appointmentId) {
          await prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: 'CONFIRMED' },
          });

          // Update slot status to BOOKED
          const appointment = await prisma.appointment.findUnique({
            where: { id: payment.appointmentId },
            select: { slotId: true },
          });

          if (appointment) {
            await prisma.appointmentSlot.update({
              where: { id: appointment.slotId },
              data: { status: 'BOOKED' },
            });
          }
        }

        logger.info(`Payment confirmed: ${payment.id}`);
        return payment;
      } else {
        throw new AppError('Payment not successful', 400);
      }
    } catch (error) {
      logger.error('Payment confirmation error:', error);
      throw new AppError('Failed to confirm payment', 500);
    }
  }

  async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            doctor: true,
            patient: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  async handleWebhook(payload: any, signature: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new AppError('Invalid webhook signature', 400);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      logger.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: paymentIntent.id,
      },
    });

    // Confirm appointment if linked
    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'CONFIRMED' },
      });

      const appointment = await prisma.appointment.findUnique({
        where: { id: payment.appointmentId },
        select: { slotId: true },
      });

      if (appointment) {
        await prisma.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: { status: 'BOOKED' },
        });
      }
    }

    logger.info(`Payment succeeded via webhook: ${payment.id}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      logger.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });

    // Cancel appointment if linked
    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'CANCELLED' },
      });

      const appointment = await prisma.appointment.findUnique({
        where: { id: payment.appointmentId },
        select: { slotId: true },
      });

      if (appointment) {
        await prisma.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    logger.info(`Payment failed via webhook: ${payment.id}`);
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      logger.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: 'Payment canceled',
      },
    });

    // Release slot if linked
    if (payment.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: payment.appointmentId },
        select: { slotId: true },
      });

      if (appointment) {
        await prisma.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    logger.info(`Payment canceled via webhook: ${payment.id}`);
  }

  async refundPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new AppError('Can only refund successful payments', 400);
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new AppError('Payment already refunded', 400);
    }

    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId || undefined,
        amount: Math.round(payment.amount * 100),
      });

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
        },
      });

      logger.info(`Payment refunded: ${paymentId}`);

      return { refundId: refund.id };
    } catch (error) {
      logger.error('Refund error:', error);
      throw new AppError('Failed to process refund', 500);
    }
  }

  async processRefund(paymentId: string) {
    // Internal method for automatic refunds
    try {
      await this.refundPayment(paymentId);
    } catch (error) {
      logger.error(`Auto-refund failed for payment: ${paymentId}`, error);
    }
  }

  async getPaymentHistory(userId: string, filters: any) {
    const { status, page = 1, limit = 10 } = filters;

    // Get user's appointments to find their payments
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const where: any = {
      appointment: {
        patientId: patient.id,
      },
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
}
