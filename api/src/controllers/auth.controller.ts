import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma, User } from '@prisma/client';
import { env } from '../config';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service';

export class AuthController {
  constructor(private db: PrismaClient) { }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedName = String(name).trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      if (normalizedName.split(/\s+/).length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Full name must contain at least two words',
        });
      }

      if (String(password).length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      // Check whether an account already exists.
      const existingUser = await this.db.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Reject registration if the existing account is verified.
      if (existingUser?.emailVerified) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
        });
      }

      // Generate a new verification token.
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const hashedVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

      let user: User;

      if (existingUser) {
        // Existing account is unverified: replace its verification token.
        user = await this.db.user.update({
          where: { id: existingUser.id },
          data: {
            verificationToken: hashedVerificationToken,
            verificationExpires,
          },
        });
      } else {
        // No existing account: create a new user.
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await this.db.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: normalizedName,
            verificationToken: hashedVerificationToken,
            verificationExpires,
          },
        });
      }

      const verificationUrl =
        `${env.FRONTEND_URL.replace(/\/$/, '')}/verify-email?token=${verificationToken}`;

      try {
        await sendVerificationEmail(normalizedEmail, verificationUrl);
      } catch (emailError) {
        console.error('Verification Email Error:', emailError);

        return res.status(503).json({
          success: false,
          error: 'Account exists, but verification email could not be sent. Please try again later.',
        });
      }

      return res.status(201).json({
        success: true,
        message: existingUser
          ? 'A new verification email has been sent. Please check your inbox.'
          : 'Registration successful. Please check your email to verify your account.',
      });

    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
        });
      }

      console.error('Registration Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification link',
        });
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Generate a temporary authentication ticket.
      const authTicket = crypto.randomBytes(32).toString('hex');

      const hashedAuthTicket = crypto
        .createHash('sha256')
        .update(authTicket)
        .digest('hex');

      const now = new Date();

      const authTicketExpires = new Date(
        now.getTime() + 2 * 60 * 1000
      );

      // Atomically verify the email and issue the authentication ticket.
      const result = await this.db.user.updateMany({
        where: {
          verificationToken: hashedToken,
          verificationExpires: {
            gt: now,
          },
          emailVerified: null,
        },
        data: {
          emailVerified: now,
          verificationToken: null,
          verificationExpires: null,
          authTicket: hashedAuthTicket,
          authTicketExpires,
        },
      });

      if (result.count === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid, expired, or already used verification link',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
        ticket: authTicket,
      });
    } catch (error) {
      console.error('Email Verification Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await this.db.user.findUnique({
        where: { email: normalizedEmail },
      });

      const passwordMatch = user
        ? await bcrypt.compare(password, user.password)
        : false;

      if (!user || !passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          error: 'Please verify your email before logging in.',
        });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        token,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Login Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async exchangeAuthTicket(req: Request, res: Response) {
    try {
      const { ticket } = req.body;

      if (!ticket || typeof ticket !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid authentication ticket',
        });
      }

      // Hash the ticket before looking it up.
      const hashedTicket = crypto
        .createHash('sha256')
        .update(ticket)
        .digest('hex');

      const now = new Date();

      // Find the user associated with this ticket.
      const user = await this.db.user.findUnique({
        where: {
          authTicket: hashedTicket,
        },
      });

      if (!user || !user.emailVerified || !user.authTicketExpires) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication ticket',
        });
      }

      // Atomically consume the ticket so it cannot be reused.
      const result = await this.db.user.updateMany({
        where: {
          id: user.id,
          authTicket: hashedTicket,
          authTicketExpires: {
            gt: now,
          },
          emailVerified: {
            not: null,
          },
        },
        data: {
          authTicket: null,
          authTicketExpires: null,
        },
      });

      if (result.count !== 1) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication ticket',
        });
      }

      // Issue the same JWT used by normal login.
      const token = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        token,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Authentication Ticket Exchange Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Me Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
