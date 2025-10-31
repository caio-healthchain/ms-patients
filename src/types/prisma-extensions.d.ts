// Temporary PrismaClient augmentation to avoid TypeScript errors
// Remove this file after running `npx prisma generate` and the generated
// client exposes the new models (Guia, GuiaProcedimentos) with proper types.

import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  // Extend the PrismaClient interface with the new models added to schema.prisma
  // These are 'any' as a temporary measure; once the generated client is
  // available, you can remove this file and rely on the generated types.
  interface PrismaClient {
    guia: any;
    guia_procedimentos: any;
    Guia: any;
    GuiaProcedimentos: any;
  }
}
