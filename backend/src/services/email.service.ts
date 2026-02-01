import { prisma } from '../lib/prisma';
import { sendEmailWithGmailAPI } from '../lib/gmail';
import { EmailStatus } from '@prisma/client';
import { getRandomQuote } from './quotes.service';
import { getMetalPricesHtml, fetchMetalPrices, formatPrice } from './metals.service';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  subscriberId: string;
  templateId?: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  try {
    await sendEmailWithGmailAPI(options.to, options.subject, options.html);

    // Log successful email
    await prisma.emailLog.create({
      data: {
        subscriberId: options.subscriberId,
        templateId: options.templateId,
        subject: options.subject,
        status: EmailStatus.SENT,
      },
    });

    console.log(`✅ Email sent to ${options.to}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed email
    await prisma.emailLog.create({
      data: {
        subscriberId: options.subscriberId,
        templateId: options.templateId,
        subject: options.subject,
        status: EmailStatus.FAILED,
        error: errorMessage,
      },
    });

    console.error(`❌ Failed to send email to ${options.to}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const sendBulkEmails = async (templateId: string) => {
  // Get active template
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId, isActive: true },
  });

  if (!template) {
    throw new Error('Template not found or inactive');
  }

  // Get all active subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: { isActive: true },
  });

  console.log(`📧 Sending emails to ${subscribers.length} subscribers...`);

  // Fetch metal prices once for all emails
  const metalPricesHtml = await getMetalPricesHtml();
  const metalPrices = await fetchMetalPrices();

  const results = await Promise.allSettled(
    subscribers.map(async (subscriber) =>
      sendEmail({
        to: subscriber.email,
        subject: template.subject.replace(/{{name}}/g, subscriber.name),
        html: await personalizeTemplate(template.body, subscriber, metalPricesHtml, metalPrices),
        subscriberId: subscriber.id,
        templateId: template.id,
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`📊 Email batch complete: ${sent} sent, ${failed} failed`);

  return { sent, failed, total: subscribers.length };
};

// Replace placeholders in template with subscriber data
const personalizeTemplate = async (template: string, subscriber: { name: string; email: string }, metalPricesHtml: string, metalPrices: any) => {
  const quote = getRandomQuote();
  const showAuthor = quote.author && quote.author.toLowerCase() !== 'unknown';
  const authorHtml = showAuthor ? `<p style="font-size: 14px; margin: 0; opacity: 0.9;">— ${quote.author}</p>` : '';
  
  const quoteHtml = quote.type === 'shayari' 
    ? `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 35px 30px; text-align: center; box-shadow: 0 10px 40px rgba(102,126,234,0.3);">
        <div style="font-size: 40px; margin-bottom: 15px;">✨</div>
        <p style="color: white; font-size: 20px; line-height: 1.7; margin: 0 0 ${showAuthor ? '15px' : '0'}; font-style: italic;">"${quote.text}"</p>
        ${showAuthor ? `<p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">— ${quote.author}</p>` : ''}
       </div>`
    : `<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 20px; padding: 35px 30px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        <div style="font-size: 40px; margin-bottom: 15px;">💫</div>
        <p style="color: white; font-size: 20px; line-height: 1.7; margin: 0 0 ${showAuthor ? '15px' : '0'}; font-style: italic;">"${quote.text}"</p>
        ${showAuthor ? `<p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0;">— ${quote.author}</p>` : ''}
       </div>`;

  const displayAuthor = showAuthor ? quote.author : '';

  return template
    .replace(/{{name}}/g, subscriber.name)
    .replace(/{{email}}/g, subscriber.email)
    .replace(/{{date}}/g, new Date().toLocaleDateString())
    .replace(/{{quote}}/g, quoteHtml)
    .replace(/{{quote_text}}/g, quote.text)
    .replace(/{{quote_author}}/g, displayAuthor)
    .replace(/{{metal_prices}}/g, metalPricesHtml)
    .replace(/{{gold_price}}/g, formatPrice(metalPrices.gold.inr * 10))
    .replace(/{{silver_price}}/g, formatPrice(metalPrices.silver.inr * 1000))
    .replace(/{{gold_price_usd}}/g, formatPrice(metalPrices.gold.usd * 10, 'USD'))
    .replace(/{{silver_price_usd}}/g, formatPrice(metalPrices.silver.usd * 1000, 'USD'));
};

export const getEmailLogs = async (limit = 100) => {
  return prisma.emailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: limit,
  });
};

export const getEmailStats = async () => {
  const [total, sent, failed] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: EmailStatus.SENT } }),
    prisma.emailLog.count({ where: { status: EmailStatus.FAILED } }),
  ]);

  return { total, sent, failed };
};
