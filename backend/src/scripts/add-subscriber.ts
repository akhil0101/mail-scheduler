import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get arguments from command line
const args = process.argv.slice(2);
const name = args[0];
const email = args[1];

async function main() {
  if (!name || !email) {
    console.log('Usage: npx tsx src/scripts/add-subscriber.ts "Name" "email@example.com"');
    process.exit(1);
  }

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`⚠️ Subscriber with email ${email} already exists`);
    return;
  }

  const subscriber = await prisma.subscriber.create({
    data: { name, email, isActive: true },
  });

  console.log(`✅ Added subscriber: ${subscriber.name} (${subscriber.email})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
