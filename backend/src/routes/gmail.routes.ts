import { Router, Request, Response } from 'express';
import { getAuthUrl, getTokensFromCode } from '../lib/gmail';

export const gmailRouter = Router();

// Get OAuth2 authorization URL
gmailRouter.get('/auth-url', (req: Request, res: Response) => {
  const authUrl = getAuthUrl();
  res.json({ authUrl });
});

// OAuth2 callback - exchange code for tokens
gmailRouter.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    // In production, you would save these tokens securely
    // For now, we display them so the user can add to .env
    res.json({
      message: 'Authorization successful! Copy the refresh_token to your .env file as GMAIL_REFRESH_TOKEN',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: 'Failed to exchange code for tokens', details: message });
  }
});

// Test email connection
gmailRouter.get('/test', async (req: Request, res: Response) => {
  try {
    const { testGmailConnection } = await import('../lib/gmail');
    const profile = await testGmailConnection();
    
    res.json({ 
      success: true, 
      message: 'Gmail connection successful!',
      email: profile.emailAddress 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});
