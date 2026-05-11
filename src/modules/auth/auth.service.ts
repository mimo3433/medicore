import { PrismaClient, UserRole } from '@prisma/client';
import { JwtUtils, TokenPayload } from '../../common/utils/jwt';
import { PasswordUtils } from '../../common/utils/password';
import { AppError } from '../../common/middleware/errorHandler';
import redis from '../../common/database/redis';
import prisma from '../../common/database/prisma';
import { logger } from '../../common/utils/logger';
import { NotificationService } from '../notifications/notification.service';

export class AuthService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async register(email: string, password: string, role: UserRole, profileData: any) {
    // Check if user already exists (only active users, not soft-deleted)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });

      // Create role-specific profile
      if (role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            userId: user.id,
            fullName: profileData.fullName || email.split('@')[0],
            specialization: profileData.specialization || 'General',
            experience: profileData.experience || 0,
            qualification: profileData.qualification || '',
            consultationFee: profileData.consultationFee || 50,
            consultationDuration: profileData.consultationDuration || 30,
            bio: profileData.bio || '',
            languages: profileData.languages || [],
            isVerified: true,
          },
        });
      } else if (role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: user.id,
            fullName: profileData.fullName || email.split('@')[0],
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
            gender: profileData.gender || null,
            phone: profileData.phone || null,
            address: profileData.address || null,
            bloodGroup: profileData.bloodGroup || null,
            allergies: profileData.allergies || null,
            emergencyContact: profileData.emergencyContact || null,
          },
        });
      }

      return user;
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
    };

    const accessToken = JwtUtils.generateAccessToken(payload);
    const refreshToken = JwtUtils.generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send verification email (in production)
    // await this.notificationService.sendVerificationEmail(result.email, verificationToken);

    logger.info(`User registered: ${result.id}`);

    return {
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtUtils.generateAccessToken(payload);
    const refreshToken = JwtUtils.generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`User logged in: ${user.id}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.doctor || user.patient,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = JwtUtils.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newPayload: TokenPayload = {
      userId: storedToken.userId,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const accessToken = JwtUtils.generateAccessToken(newPayload);
    const newRefreshToken = JwtUtils.generateRefreshToken(newPayload);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      try {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        });
      } catch (err) {
        // Token may not exist in DB, ignore
      }
    }

    if (userId) {
      logger.info(`User logged out: ${userId}`);
    }
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info(`User logged out from all devices: ${userId}`);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token (in production, use crypto)
    const resetToken = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');

    // Store in Redis with expiry
    // await redis.setex(`reset:${resetToken}`, 3600, user.id);

    // Send reset email (in production)
    // await this.notificationService.sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset requested for: ${email}`);
  }

  async resetPassword(token: string, newPassword: string) {
    // Verify token from Redis (in production)
    // const userId = await redis.get(`reset:${token}`);

    // For now, decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split('-')[0];

    if (!userId) {
      throw new AppError('Invalid reset token', 400);
    }

    // Hash new password
    const hashedPassword = await PasswordUtils.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete reset token from Redis
    // await redis.del(`reset:${token}`);

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    logger.info(`Password reset for user: ${userId}`);
  }

  async verifyEmail(token: string) {
    // Verify token (in production)
    // const userId = await redis.get(`verify:${token}`);

    // For now, decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split('-')[0];

    if (!userId) {
      throw new AppError('Invalid verification token', 400);
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, emailVerified: new Date() },
    });

    logger.info(`Email verified for user: ${userId}`);
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateMe(userId: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true, patient: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'PATIENT' && user.patient) {
      await prisma.patient.update({
        where: { userId },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          allergies: data.allergies,
          emergencyContact: data.emergencyContact,
        },
      });
    }

    return this.getMe(userId);
  }
}
