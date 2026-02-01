import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.emailTemplate.create({
    data: {
      name: 'Daily Motivation & Shayari',
      subject: 'Good Morning {{name}}! ✨ Your Daily Dose of Inspiration',
      body: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 0 0 30px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Good Morning, {{name}}! 🌅</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">{{date}}</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px 20px;">
    <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
      Hope you're having a wonderful start to your day! Here's something special to inspire you today:
    </p>
    
    <!-- Quote Box -->
    {{quote}}
    
    <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 20px 0;">
      Remember, every morning is a fresh start. Yesterday's failures don't define today's possibilities. Take a deep breath, smile, and make today count! 💪
    </p>
    
    <!-- Tips Section -->
    <div style="background: #fff; border-radius: 15px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🎯 Today's Focus</h3>
      <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Take 5 minutes for yourself</li>
        <li>Drink plenty of water</li>
        <li>Be kind to someone today</li>
        <li>Celebrate small wins</li>
      </ul>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background: #333; padding: 25px 20px; text-align: center;">
    <p style="color: #aaa; font-size: 14px; margin: 0 0 10px 0;">
      Have a wonderful day ahead! ❤️
    </p>
    <p style="color: #888; font-size: 12px; margin: 0;">
      You're receiving this because you subscribed to Daily Motivation.<br>
      Made with love for {{name}}
    </p>
  </div>
</div>
      `.trim(),
      isActive: true,
    },
  });

  console.log('✅ Template created successfully!');
  console.log('Template ID:', template.id);
  console.log('Template Name:', template.name);
}

main()
  .catch((e) => {
    console.error('Error creating template:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
