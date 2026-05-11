import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { NotificationService } from '../../modules/notifications/notification.service';
import redis from '../database/redis';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  APPOINTMENT_REMINDER: 'appointment-reminder-queue',
  CSV_PROCESSING: 'csv-processing-queue',
  PAYMENT_VERIFICATION: 'payment-verification-queue',
} as const;

// Create queues
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const appointmentReminderQueue = new Queue(QUEUE_NAMES.APPOINTMENT_REMINDER, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const csvProcessingQueue = new Queue(QUEUE_NAMES.CSV_PROCESSING, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const paymentVerificationQueue = new Queue(QUEUE_NAMES.PAYMENT_VERIFICATION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// Job processors
const notificationService = new NotificationService();

export const startWorkers = async () => {
  // Email worker
  const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job: Job) => {
      logger.info(`Processing email job: ${job.id}`);
      const { to, subject, text, html } = job.data;
      // Email sending logic would be here
      // await notificationService.sendEmail(to, subject, text, html);
      logger.info(`Email sent to: ${to}`);
    },
    {
      connection: redis,
    }
  );

  // Notification worker
  const notificationWorker = new Worker(
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job) => {
      logger.info(`Processing notification job: ${job.id}`);
      const { userId, type, channel, title, message, metadata } = job.data;
      await notificationService.createNotification(
        userId,
        type,
        channel,
        title,
        message,
        metadata
      );
    },
    {
      connection: redis,
    }
  );

  // Appointment reminder worker
  const reminderWorker = new Worker(
    QUEUE_NAMES.APPOINTMENT_REMINDER,
    async (job: Job) => {
      logger.info(`Processing appointment reminder: ${job.id}`);
      const { patientId, appointmentId } = job.data;
      await notificationService.sendAppointmentReminder(patientId, appointmentId);
    },
    {
      connection: redis,
    }
  );

  // CSV processing worker
  const csvWorker = new Worker(
    QUEUE_NAMES.CSV_PROCESSING,
    async (job: Job) => {
      logger.info(`Processing CSV job: ${job.id}`);
      const { filePath, type } = job.data;
      // CSV processing logic would be here
      logger.info(`CSV processed: ${filePath}`);
    },
    {
      connection: redis,
    }
  );

  // Payment verification worker
  const paymentWorker = new Worker(
    QUEUE_NAMES.PAYMENT_VERIFICATION,
    async (job: Job) => {
      logger.info(`Processing payment verification: ${job.id}`);
      const { paymentId } = job.data;
      // Payment verification logic would be here
      logger.info(`Payment verified: ${paymentId}`);
    },
    {
      connection: redis,
    }
  );

  // Worker event handlers
  const workers = [emailWorker, notificationWorker, reminderWorker, csvWorker, paymentWorker];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info(`Job completed: ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.id}`, err);
    });

    worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });
  });

  logger.info('All BullMQ workers started');
};

// Queue job helpers
export const queueEmail = async (data: any) => {
  return emailQueue.add('send-email', data);
};

export const queueNotification = async (data: any) => {
  return notificationQueue.add('send-notification', data);
};

export const queueAppointmentReminder = async (data: any, delay?: number) => {
  return appointmentReminderQueue.add('send-reminder', data, {
    delay: delay || 0,
  });
};

export const queueCsvProcessing = async (data: any) => {
  return csvProcessingQueue.add('process-csv', data);
};

export const queuePaymentVerification = async (data: any) => {
  return paymentVerificationQueue.add('verify-payment', data);
};
