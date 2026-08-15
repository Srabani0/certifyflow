import { PrismaClient } from '@prisma/client';
import { academicFormal } from './templates/academicFormal';
import { classicElegant } from './templates/classicElegant';
import { corporateBlue } from './templates/corporateBlue';
import { goldAchievement } from './templates/goldAchievement';
import { modernMinimal } from './templates/modernMinimal';
import { CERTIFICATE_HTML, type CertificateTemplateDefinition } from './templates/shared';
import { sportsChampion } from './templates/sportsChampion';
import { techHackathon } from './templates/techHackathon';
import { vibrantFest } from './templates/vibrantFest';

const prisma = new PrismaClient();

const templates: CertificateTemplateDefinition[] = [
  classicElegant,
  modernMinimal,
  corporateBlue,
  goldAchievement,
  techHackathon,
  sportsChampion,
  academicFormal,
  vibrantFest,
];

async function main(): Promise<void> {
  for (const template of templates) {
    const existing = await prisma.certificateTemplate.findFirst({ where: { name: template.name } });

    if (existing) {
      await prisma.certificateTemplate.update({
        where: { id: existing.id },
        data: {
          category: template.category,
          description: template.description,
          htmlContent: CERTIFICATE_HTML,
          cssContent: template.css,
          isActive: true,
        },
      });
      console.log(`Updated template: ${template.name}`);
    } else {
      await prisma.certificateTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          description: template.description,
          htmlContent: CERTIFICATE_HTML,
          cssContent: template.css,
          isActive: true,
        },
      });
      console.log(`Created template: ${template.name}`);
    }
  }
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
