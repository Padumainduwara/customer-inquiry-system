import { PrismaClient, Role, InquiryStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@coffeeninja.lk' },
    update: {},
    create: {
      name: 'Nimal Perera (Manager)',
      email: 'admin@coffeeninja.lk',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@coffeeninja.lk' },
    update: {},
    create: {
      name: 'Kasun Silva',
      email: 'staff1@coffeeninja.lk',
      password: passwordHash,
      role: Role.STAFF,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@coffeeninja.lk' },
    update: {},
    create: {
      name: 'Dilini Fernando',
      email: 'staff2@coffeeninja.lk',
      password: passwordHash,
      role: Role.STAFF,
    },
  });

  // 2. Seed Sample Inquiries (only if table is empty)
  const existingCount = await prisma.inquiry.count();
  if (existingCount === 0) {
    await prisma.inquiry.createMany({
      data: [
        {
          customerName: 'Amal Jayasinghe',
          customerContact: 'amal@example.com',
          subject: 'Office catering quote for 50 people',
          description: 'Needs coffee and pastry packages for a Friday morning seminar in Colombo 03.',
          status: InquiryStatus.NEW,
          priority: Priority.HIGH,
          createdById: staff1.id,
        },
        {
          customerName: 'Ruwan Bandara',
          customerContact: '+94 77 123 4567',
          subject: 'Espresso machine maintenance',
          description: 'Machine pressure drops after 10 cups. Requested a technician visit.',
          status: InquiryStatus.IN_PROGRESS,
          priority: Priority.MEDIUM,
          createdById: staff1.id,
        },
        {
          customerName: 'Sithumi Perera',
          customerContact: 'sithumi@example.com',
          subject: 'Monthly bean subscription inquiry',
          description: 'Asked for wholesale rates for 10kg medium roast beans per month.',
          status: InquiryStatus.NEW,
          priority: Priority.LOW,
          createdById: staff2.id,
        },
        {
          customerName: 'Tharindu De Silva',
          customerContact: '+94 71 987 6543',
          subject: 'Invoice correction for Order #402',
          description: 'Billing address needed to be updated with VAT registration number.',
          status: InquiryStatus.RESOLVED,
          priority: Priority.LOW,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log('Seed completed successfully!');
  console.log('Accounts (password: password123):');
  console.log(' - admin@coffeeninja.lk (ADMIN)');
  console.log(' - staff1@coffeeninja.lk (STAFF)');
  console.log(' - staff2@coffeeninja.lk (STAFF)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });