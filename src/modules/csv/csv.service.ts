import { Prisma } from '@prisma/client';
import prisma from '../../common/database/prisma';
import { AppError } from '../../common/middleware/errorHandler';
import { logger } from '../../common/utils/logger';
import { createObjectCsvWriter } from 'csv-writer';
import { createReadStream } from 'fs';
import { parse } from 'csv-parser';

export class CsvService {
  async exportAppointments(filters: any) {
    const { startDate, endDate, status, doctorId } = filters;

    const where: Prisma.AppointmentWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        slot: true,
        payment: true,
      },
    });

    const csvData = appointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient.fullName,
      patientEmail: apt.patient.user.email,
      doctorName: apt.doctor.fullName,
      doctorEmail: apt.doctor.user.email,
      date: apt.slot.date,
      time: apt.slot.startTime,
      status: apt.status,
      amount: apt.payment?.amount || 0,
      paymentStatus: apt.payment?.status || 'N/A',
      createdAt: apt.createdAt,
    }));

    return csvData;
  }

  async exportDoctors(filters: any) {
    const { specialization, isVerified } = filters;

    const where: Prisma.DoctorWhereInput = {};

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: true,
        _count: {
          select: { appointments: true },
        },
      },
    });

    const csvData = doctors.map((doc) => ({
      id: doc.id,
      name: doc.fullName,
      email: doc.user.email,
      specialization: doc.specialization,
      experience: doc.experience,
      qualification: doc.qualification,
      consultationFee: doc.consultationFee,
      rating: doc.rating,
      totalReviews: doc.totalReviews,
      totalAppointments: doc._count.appointments,
      isVerified: doc.isVerified,
      isActive: doc.user.isActive,
      createdAt: doc.createdAt,
    }));

    return csvData;
  }

  async exportPatients(filters: any) {
    const { startDate, endDate } = filters;

    const where: Prisma.PatientWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        user: true,
        _count: {
          select: { appointments: true },
        },
      },
    });

    const csvData = patients.map((pat) => ({
      id: pat.id,
      name: pat.fullName,
      email: pat.user.email,
      phone: pat.phone,
      dateOfBirth: pat.dateOfBirth,
      gender: pat.gender,
      bloodGroup: pat.bloodGroup,
      totalAppointments: pat._count.appointments,
      isActive: pat.user.isActive,
      createdAt: pat.createdAt,
    }));

    return csvData;
  }

  async exportRevenue(filters: any) {
    const { startDate, endDate } = filters;

    const where: Prisma.PaymentWhereInput = {
      status: 'SUCCESS',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: true,
            patient: true,
          },
        },
      },
    });

    const csvData = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      doctorName: payment.appointment?.doctor.fullName || 'N/A',
      patientName: payment.appointment?.patient.fullName || 'N/A',
      status: payment.status,
      createdAt: payment.createdAt,
    }));

    return csvData;
  }

  async importDoctors(filePath: string) {
    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(parse())
        .on('data', async (row) => {
          results.push(row);
        })
        .on('end', async () => {
          try {
            const imported = [];
            for (const row of results) {
              try {
                const user = await prisma.user.create({
                  data: {
                    email: row.email,
                    password: await this.hashPassword('defaultPassword123'), // Should be changed
                    role: 'DOCTOR',
                  },
                });

                const doctor = await prisma.doctor.create({
                  data: {
                    userId: user.id,
                    fullName: row.fullName,
                    specialization: row.specialization,
                    experience: parseInt(row.experience) || 0,
                    qualification: row.qualification,
                    consultationFee: parseFloat(row.consultationFee) || 50,
                  },
                });

                imported.push(doctor);
              } catch (error) {
                errors.push({ row, error: error.message });
              }
            }
            resolve({ imported, errors });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async importPatients(filePath: string) {
    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(parse())
        .on('data', async (row) => {
          results.push(row);
        })
        .on('end', async () => {
          try {
            const imported = [];
            for (const row of results) {
              try {
                const user = await prisma.user.create({
                  data: {
                    email: row.email,
                    password: await this.hashPassword('defaultPassword123'),
                    role: 'PATIENT',
                  },
                });

                const patient = await prisma.patient.create({
                  data: {
                    userId: user.id,
                    fullName: row.fullName,
                    phone: row.phone,
                  },
                });

                imported.push(patient);
              } catch (error) {
                errors.push({ row, error: error.message });
              }
            }
            resolve({ imported, errors });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async writeCsvFile(data: any[], filename: string) {
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: Object.keys(data[0] || {}).map((key) => ({
        id: key,
        title: key,
      })),
    });

    await csvWriter.writeRecords(data);
    return filename;
  }
}
