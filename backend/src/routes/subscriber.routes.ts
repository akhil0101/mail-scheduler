import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

export const subscriberRouter = Router();

const subscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// Apply auth middleware to all routes
subscriberRouter.use(authMiddleware);

// Get all subscribers
subscriberRouter.get('/', async (req: Request, res: Response) => {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
  });
  res.json(subscribers);
});

// Get subscriber stats
subscriberRouter.get('/stats', async (req: Request, res: Response) => {
  const [total, active, inactive] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { isActive: true } }),
    prisma.subscriber.count({ where: { isActive: false } }),
  ]);
  res.json({ total, active, inactive });
});

// Get single subscriber
subscriberRouter.get('/:id', async (req: Request, res: Response) => {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: req.params.id },
  });

  if (!subscriber) {
    return res.status(404).json({ error: 'Subscriber not found' });
  }

  res.json(subscriber);
});

// Create subscriber
subscriberRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = subscriberSchema.parse(req.body);

    const existing = await prisma.subscriber.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    const subscriber = await prisma.subscriber.create({ data });
    res.status(201).json(subscriber);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Update subscriber
subscriberRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = subscriberSchema.partial().parse(req.body);

    const subscriber = await prisma.subscriber.update({
      where: { id: req.params.id },
      data,
    });

    res.json(subscriber);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Toggle subscriber active status
subscriberRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: req.params.id },
  });

  if (!subscriber) {
    return res.status(404).json({ error: 'Subscriber not found' });
  }

  const updated = await prisma.subscriber.update({
    where: { id: req.params.id },
    data: { isActive: !subscriber.isActive },
  });

  res.json(updated);
});

// Delete subscriber
subscriberRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.subscriber.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
});

// Bulk import subscribers
subscriberRouter.post('/import', async (req: Request, res: Response) => {
  const { subscribers } = req.body as { subscribers: { email: string; name: string }[] };

  if (!Array.isArray(subscribers)) {
    return res.status(400).json({ error: 'Invalid subscribers array' });
  }

  const results = await Promise.allSettled(
    subscribers.map(async (sub) => {
      const data = subscriberSchema.parse(sub);
      return prisma.subscriber.upsert({
        where: { email: data.email },
        update: { name: data.name },
        create: data,
      });
    })
  );

  const imported = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  res.json({ imported, failed, total: subscribers.length });
});
