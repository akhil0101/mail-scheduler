import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

const prisma = new PrismaClient();

async function main() {
  // Check for subscribers
  const subscribers = await prisma.subscriber.findMany({ where: { isActive: true } });
  console.log(`Found ${subscribers.length} active subscriber(s)`);
  
  if (subscribers.length === 0) {
    // Create a test subscriber with the user's email
    console.log('No subscribers found. Creating test subscriber...');
    await prisma.subscriber.create({
      data: {
        email: 'akhilkandakatla1997@gmail.com',
        name: 'Akhil',
        isActive: true,
      },
    });
    console.log('✅ Test subscriber created: akhilkandakatla1997@gmail.com');
  }

  // Get the template
  const template = await prisma.emailTemplate.findFirst({ where: { isActive: true } });
  if (!template) {
    console.log('❌ No active template found!');
    return;
  }
  console.log(`Using template: ${template.name}`);

  // Import and send
  const { sendBulkEmails } = await import('../services/email.service');
  console.log('📧 Sending emails...');
  
  const result = await sendBulkEmails(template.id);
  console.log(`✅ Done! Sent: ${result.sent}, Failed: ${result.failed}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
