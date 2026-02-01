import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { google } from 'googleapis';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

export const authRouter = Router();

const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client for user authentication
const createAuthClient = () => {
  return new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  );
};

// Get Google OAuth URL for sign in
authRouter.get('/google/url', (req: Request, res: Response) => {
  const oauth2Client = createAuthClient();
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.json({ authUrl });
});

// Google OAuth callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.redirect('http://localhost:5173/login?error=no_code');
  }

  try {
    const oauth2Client = createAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email) {
      return res.redirect('http://localhost:5173/login?error=no_email');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          password: '', // No password for Google auth
          googleId: googleUser.id,
        },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id },
      });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
});

// Get current user
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});
