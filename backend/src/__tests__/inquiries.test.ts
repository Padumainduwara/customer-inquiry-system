import 'dotenv/config';
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

describe('Customer Inquiry API - Security, Validation & Business Rules', () => {
  const createdInquiryIds: string[] = [];

  afterAll(async () => {
    // Clean up only the test records we created
    if (createdInquiryIds.length > 0) {
      await prisma.inquiry.deleteMany({
        where: { id: { in: createdInquiryIds } },
      });
    }
    await prisma.$disconnect();
  });

  it('1. Rejects unauthenticated access to inquiries with 401', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  it('2. Rejects invalid inquiry payload with 400 and field errors', async () => {
    const staff1 = request.agent(app);
    await staff1
      .post('/api/auth/login')
      .send({ email: 'staff1@coffeeninja.lk', password: 'password123' })
      .expect(200);

    const res = await staff1.post('/api/inquiries').send({
      customerName: 'A', // too short
      customerContact: '', // missing
      subject: 'Hi', // too short
      description: 'Short', // too short
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.customerName).toBeDefined();
    expect(res.body.details.customerContact).toBeDefined();
  });

  it('3. Enforces ownership: blocks staff2 from viewing staff1 inquiry directly (403)', async () => {
    const staff1 = request.agent(app);
    const staff2 = request.agent(app);

    await staff1
      .post('/api/auth/login')
      .send({ email: 'staff1@coffeeninja.lk', password: 'password123' })
      .expect(200);

    await staff2
      .post('/api/auth/login')
      .send({ email: 'staff2@coffeeninja.lk', password: 'password123' })
      .expect(200);

    // Staff 1 creates an inquiry
    const createRes = await staff1
      .post('/api/inquiries')
      .send({
        customerName: 'Test Customer',
        customerContact: 'test@example.com',
        subject: 'Ownership test inquiry',
        description: 'Testing that another staff member cannot open this directly.',
        priority: 'HIGH',
      })
      .expect(201);

    const inquiryId = createRes.body.inquiry.id;
    createdInquiryIds.push(inquiryId);

    // Staff 2 tries to open Staff 1's inquiry via direct URL/ID
    const forbiddenRes = await staff2.get(`/api/inquiries/${inquiryId}`);
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toMatch(/do not have permission/i);
  });

  it('4. Rejects invalid status transition NEW -> RESOLVED with 400', async () => {
    const staff1 = request.agent(app);
    await staff1
      .post('/api/auth/login')
      .send({ email: 'staff1@coffeeninja.lk', password: 'password123' })
      .expect(200);

    const createRes = await staff1
      .post('/api/inquiries')
      .send({
        customerName: 'Lifecycle Customer',
        customerContact: '+94 77 000 0000',
        subject: 'State machine test',
        description: 'Testing that NEW cannot jump directly to RESOLVED.',
      })
      .expect(201);

    const inquiry = createRes.body.inquiry;
    createdInquiryIds.push(inquiry.id);

    // Attempt invalid transition: NEW -> RESOLVED
    const invalidRes = await staff1
      .patch(`/api/inquiries/${inquiry.id}/status`)
      .send({ status: 'RESOLVED', version: inquiry.version });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toMatch(/invalid status transition/i);
  });

  it('5. Rejects stale-data update with 409 Conflict (Optimistic Locking)', async () => {
    const staff1 = request.agent(app);
    await staff1
      .post('/api/auth/login')
      .send({ email: 'staff1@coffeeninja.lk', password: 'password123' })
      .expect(200);

    const createRes = await staff1
      .post('/api/inquiries')
      .send({
        customerName: 'Stale Tab Customer',
        customerContact: 'stale@example.com',
        subject: 'Two-tab conflict test',
        description: 'Simulating two browser tabs updating the same inquiry.',
      })
      .expect(201);

    const inquiry = createRes.body.inquiry;
    createdInquiryIds.push(inquiry.id);

    // Tab 1 updates status: NEW -> IN_PROGRESS (version 1 -> 2)
    await staff1
      .patch(`/api/inquiries/${inquiry.id}/status`)
      .send({ status: 'IN_PROGRESS', version: 1 })
      .expect(200);

    // Tab 2 still has stale version: 1 and tries to update
    const staleRes = await staff1
      .patch(`/api/inquiries/${inquiry.id}/status`)
      .send({ status: 'RESOLVED', version: 1 });

    expect(staleRes.status).toBe(409);
    expect(staleRes.body.code).toBe('STALE_DATA');
  });
});