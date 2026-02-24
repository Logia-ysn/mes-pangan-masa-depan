import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const params = {
    reference_type: 'RAW_MATERIAL_RECEIPT',
    movement_type: 'IN',
    limit: 200
  };

  const movements = await prisma.stockMovement.findMany({
    where: {
      reference_type: params.reference_type,
      movement_type: "IN"
    },
    take: params.limit,
    include: {
      Stock: {
        include: {
          Factory: true,
          ProductType: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const selectedFactory = 1;

  const batches = movements.filter((m: any) => {
    const stock = m.Stock;
    return stock && (!selectedFactory || stock.id_factory === selectedFactory);
  });

  console.log(`Found movements: ${movements.length}`);
  console.log(`Filtered batches: ${batches.length}`);
  if (batches.length > 0) {
    console.log("Movement IDs:", batches.map((m: any) => m.id));
    console.log("First batch:", batches[0]);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
