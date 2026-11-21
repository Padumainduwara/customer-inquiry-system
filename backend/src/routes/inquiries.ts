import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { InquiryStatus, Priority, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { canTransitionStatus } from '../utils/statusMachine';

const router = Router();

// All inquiry routes require authentication
router.use(requireAuth);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createInquirySchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name must be at least 2 characters').max(100),
  customerContact: z.string().trim().min(5, 'Enter a valid email or phone number').max(100),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
  version: z.number().int().positive('Version must be a positive integer'),
});

// GET /api/inquiries?status=NEW&priority=HIGH&search=coffee
router.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  const { status, priority, search } = req.query;

  const where: any = {};

  // Ownership rule: STAFF only sees their own inquiries; ADMIN sees all
  if (user.role !== Role.ADMIN) {
    where.createdById = user.id;
  }

  if (status && Object.values(InquiryStatus).includes(status as InquiryStatus)) {
    where.status = status;
  }

  if (priority && Object.values(Priority).includes(priority as Priority)) {
    where.priority = priority;
  }

  if (typeof search === 'string' && search.trim().length > 0) {
    const q = search.trim();
    where.OR = [
      { customerName: { contains: q, mode: 'insensitive' } },
      { customerContact: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
    ];
  }

  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ inquiries });
});

// POST /api/inquiries
router.post('/', async (req: Request, res: Response) => {
  const parsed = createInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      ...parsed.data,
      createdById: req.user!.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({ inquiry });
});

// GET /api/inquiries/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid inquiry ID format' });
    return;
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!inquiry) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  // Enforce ownership at API level
  if (req.user!.role !== Role.ADMIN && inquiry.createdById !== req.user!.id) {
    res.status(403).json({ error: 'You do not have permission to view this inquiry' });
    return;
  }

  res.json({ inquiry });
});

// PATCH /api/inquiries/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid inquiry ID format' });
    return;
  }

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { status: nextStatus, version } = parsed.data;

  const existing = await prisma.inquiry.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  // Enforce ownership at API level
  if (req.user!.role !== Role.ADMIN && existing.createdById !== req.user!.id) {
    res.status(403).json({ error: 'You do not have permission to update this inquiry' });
    return;
  }

  // Optimistic locking check (Stale data protection)
  if (existing.version !== version) {
    res.status(409).json({
      error: 'This inquiry was updated in another session. Please refresh to see the latest version.',
      code: 'STALE_DATA',
      latest: existing,
    });
    return;
  }

  // Status transition rule check
  if (!canTransitionStatus(existing.status, nextStatus)) {
    res.status(400).json({
      error: `Invalid status transition from ${existing.status} to ${nextStatus}.`,
    });
    return;
  }

  // Atomic version-checked update
  const updated = await prisma.inquiry.updateMany({
    where: { id, version },
    data: {
      status: nextStatus,
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    res.status(409).json({
      error: 'This inquiry was updated in another session. Please refresh to see the latest version.',
      code: 'STALE_DATA',
    });
    return;
  }

  const freshInquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ inquiry: freshInquiry });
});

export default router;