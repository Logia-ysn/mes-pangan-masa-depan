import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const where = { reference_type: 'RAW_MATERIAL_RECEIPT', movement_type: 'IN' as const };
  const movements = await prisma.stockMovement.findMany({
    where,
    take: 200,
    orderBy: { created_at: 'desc' },
    include: { Stock: { include: { Factory: true, ProductType: true } }, User: true }
  });
  
  const total = await prisma.stockMovement.count({ where });

  // This is what t_getStockMovements.ts returns!
  const backendReturn = { data: movements as any, total };
  
  // This is what apiWrapper does!
  const apiFormat = backendReturn;

  console.log("apiFormat keys:", Object.keys(apiFormat));
  console.log("apiFormat.data is Array?", Array.isArray(apiFormat.data));

  // Now simulate axios fetching this (with standard res.data = apiFormat)
  // in WorksheetForm: const movements = res.data?.data || []
  const frontendMovements = apiFormat.data || [];
  console.log("Frontend movements is Array?", Array.isArray(frontendMovements));
  
  if (Array.isArray(frontendMovements)) {
      console.log("First element:", frontendMovements[0]?.reference_type, "Stock:", !!frontendMovements[0]?.Stock);
  } else {
      console.log("Frontend movements keys:", Object.keys(frontendMovements));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
