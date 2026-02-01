import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

export const templateRouter = Router();

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  isActive: z.boolean().optional(),
});

// Apply auth middleware to all routes
templateRouter.use(authMiddleware);

// Get all templates
templateRouter.get('/', async (req: Request, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(templates);
});

// Get single template
templateRouter.get('/:id', async (req: Request, res: Response) => {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

// Create template
templateRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await prisma.emailTemplate.create({ data });
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Update template
templateRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = templateSchema.partial().parse(req.body);

    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data,
    });

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Toggle template active status
templateRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const updated = await prisma.emailTemplate.update({
    where: { id: req.params.id },
    data: { isActive: !template.isActive },
  });

  res.json(updated);
});

// Delete template
templateRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.emailTemplate.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
});

// Preview template (replace placeholders with sample data)
templateRouter.post('/:id/preview', async (req: Request, res: Response) => {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: req.params.id },
  });

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const sampleQuote = {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  };

  const quoteHtml = `<div style="font-style: italic; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; margin: 20px 0; text-align: center;">
    <p style="font-size: 18px; margin: 0 0 10px 0;">"${sampleQuote.text}"</p>
    <p style="font-size: 14px; margin: 0; opacity: 0.9;">— ${sampleQuote.author}</p>
  </div>`;

  const previewBody = template.body
    .replace(/{{name}}/g, 'John Doe')
    .replace(/{{email}}/g, 'john@example.com')
    .replace(/{{date}}/g, new Date().toLocaleDateString())
    .replace(/{{quote}}/g, quoteHtml)
    .replace(/{{quote_text}}/g, sampleQuote.text)
    .replace(/{{quote_author}}/g, sampleQuote.author);

  res.json({
    subject: template.subject,
    body: previewBody,
  });
});
