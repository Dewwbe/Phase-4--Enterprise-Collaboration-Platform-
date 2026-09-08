import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Str0ngP@ssword!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@ecp.dev' },
    update: {},
    create: {
      email: 'owner@ecp.dev',
      passwordHash,
      firstName: 'Owner',
      lastName: 'User',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@ecp.dev' },
    update: {},
    create: {
      email: 'member@ecp.dev',
      passwordHash,
      firstName: 'Member',
      lastName: 'User',
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.workspace.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: 'engineering' } },
    update: {},
    create: {
      name: 'Engineering',
      slug: 'engineering',
      organizationId: organization.id,
      members: {
        create: [
          { userId: owner.id, role: 'OWNER', joinedAt: new Date() },
          { userId: member.id, role: 'MEMBER', joinedAt: new Date() },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with owner@ecp.dev / Str0ngP@ssword!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
