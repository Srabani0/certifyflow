import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const organizations = await prisma.organization.findMany();

  for (const organization of organizations) {
    const existingUser = await prisma.user.findUnique({ where: { email: organization.email } });
    if (existingUser) {
      console.log(`Skipped (already backfilled): ${organization.email}`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: organization.name,
          email: organization.email,
          passwordHash: organization.passwordHash,
        },
      });
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });
    });

    console.log(`Backfilled: ${organization.email} -> OWNER of "${organization.name}"`);
  }

  console.log(`Done. Processed ${organizations.length} organization(s).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
