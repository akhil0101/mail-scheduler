import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getScheduleConfig,
  updateSchedule,
  triggerManualSend,
} from '../services/scheduler.service';
import { getEmailLogs, getEmailStats } from '../services/email.service';

export const scheduleRouter = Router();

const scheduleSchema = z.object({
  cronTime: z.string().min(1),
  timezone: z.string().min(1),
  isActive: z.boolean(),
});

// Apply auth middleware to all routes
scheduleRouter.use(authMiddleware);

// Get current schedule config
scheduleRouter.get('/', async (req: Request, res: Response) => {
  const config = await getScheduleConfig();
  res.json(config);
});

// Update schedule config
scheduleRouter.put('/', async (req: Request, res: Response) => {
  try {
    const { cronTime, timezone, isActive } = scheduleSchema.parse(req.body);
    const config = await updateSchedule(cronTime, timezone, isActive);
    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Trigger manual email send
scheduleRouter.post('/send', async (req: Request, res: Response) => {
  const { templateId } = req.body;

  if (!templateId) {
    return res.status(400).json({ error: 'templateId is required' });
  }

  try {
    const result = await triggerManualSend(templateId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// Get email logs
scheduleRouter.get('/logs', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = await getEmailLogs(limit);
  res.json(logs);
});

// Get email stats
scheduleRouter.get('/stats', async (req: Request, res: Response) => {
  const stats = await getEmailStats();
  res.json(stats);
});
