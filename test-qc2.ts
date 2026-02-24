import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const receipts = await prisma.materialReceipt.findMany({
    orderBy: { id: 'desc' },
    take: 3,
    include: {
      StockMovement: {
        include: {
          RawMaterialQualityAnalysis: true
        }
      }
    }
  });

  for (const r of receipts) {
    const qc = r.StockMovement?.RawMaterialQualityAnalysis;
    console.log(`Receipt ID: ${r.id}, Code: ${r.batch_code}`);
    if (qc && qc.length > 0) {
      console.log(`  -> QC FOUND: Moisture=${qc[0].moisture_value}, Density=${qc[0].density_value}, Grade=${qc[0].final_grade}, Green=${qc[0].green_percentage}`);
    } else {
      console.log(`  -> NO QC DATA`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
