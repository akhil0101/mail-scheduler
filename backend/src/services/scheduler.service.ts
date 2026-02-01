import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendBulkEmails } from './email.service';

let scheduledTask: ScheduledTask | null = null;

export const initializeScheduler = async () => {
  try {
    // Get schedule config from database or create default
    let config = await prisma.scheduleConfig.findFirst();
    
    if (!config) {
      config = await prisma.scheduleConfig.create({
        data: {
          cronTime: '0 9 * * *', // Default: 9 AM daily
          timezone: 'UTC',
          isActive: true,
        },
      });
      console.log('📅 Created default schedule config');
    }

    if (config.isActive) {
      startScheduler(config.cronTime, config.timezone);
    } else {
      console.log('📅 Scheduler is disabled');
    }
  } catch (error) {
    console.error('Failed to initialize scheduler:', error);
  }
};

export const startScheduler = (cronTime: string, timezone: string) => {
  // Stop existing scheduler if any
  stopScheduler();

  if (!cron.validate(cronTime)) {
    console.error('❌ Invalid cron expression:', cronTime);
    return;
  }

  scheduledTask = cron.schedule(
    cronTime,
    async () => {
      console.log('⏰ Scheduled email job triggered at', new Date().toISOString());
      
      try {
        // Get active template (you could have logic to select which template)
        const template = await prisma.emailTemplate.findFirst({
          where: { isActive: true },
        });

        if (template) {
          await sendBulkEmails(template.id);
        } else {
          console.log('⚠️ No active email template found');
        }
      } catch (error) {
        console.error('❌ Scheduled email job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: timezone,
    }
  );

  console.log(`📅 Scheduler started: ${cronTime} (${timezone})`);
};

export const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('📅 Scheduler stopped');
  }
};

export const updateSchedule = async (cronTime: string, timezone: string, isActive: boolean) => {
  const config = await prisma.scheduleConfig.findFirst();
  
  if (config) {
    await prisma.scheduleConfig.update({
      where: { id: config.id },
      data: { cronTime, timezone, isActive },
    });
  } else {
    await prisma.scheduleConfig.create({
      data: { cronTime, timezone, isActive },
    });
  }

  if (isActive) {
    startScheduler(cronTime, timezone);
  } else {
    stopScheduler();
  }

  return { cronTime, timezone, isActive };
};

export const getScheduleConfig = async () => {
  return prisma.scheduleConfig.findFirst();
};

export const triggerManualSend = async (templateId: string) => {
  console.log('🚀 Manual email send triggered');
  return sendBulkEmails(templateId);
};
