const prisma = require('./src/config/prisma').default;
const connectDb = require('./src/config/prisma').connectDb;

async function testPrisma() {
  try {
    await connectDb();
    const userCount = await prisma.user.count();
    console.log(`Prisma connected successfully. User count: ${userCount}`);
  } catch (error) {
    console.error('Prisma connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();