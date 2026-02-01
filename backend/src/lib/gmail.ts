import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client
export const createOAuth2Client = () => {
  return new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
};

// Get authenticated Gmail client
export const getGmailClient = () => {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Encode subject for UTF-8 (RFC 2047) to support emojis
const encodeSubject = (subject: string): string => {
  // Check if subject contains non-ASCII characters
  if (/[^\x00-\x7F]/.test(subject)) {
    const encoded = Buffer.from(subject, 'utf-8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
  }
  return subject;
};

// Create email in base64 format
const createEmail = (to: string, subject: string, html: string) => {
  const encodedSubject = encodeSubject(subject);
  
  const email = [
    `To: ${to}`,
    `From: ${process.env.EMAIL_FROM}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n');

  return Buffer.from(email, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Send email using Gmail API
export const sendEmailWithGmailAPI = async (to: string, subject: string, html: string) => {
  const gmail = getGmailClient();
  const raw = createEmail(to, subject, html);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: raw,
    },
  });

  return response.data;
};

// Test Gmail connection
export const testGmailConnection = async () => {
  const gmail = getGmailClient();
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return profile.data;
};

// Generate OAuth2 URL for initial authorization
export const getAuthUrl = () => {
  const oauth2Client = createOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

// Exchange authorization code for tokens
export const getTokensFromCode = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};
