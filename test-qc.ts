import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const receipts = await prisma.materialReceipt.findMany({
    orderBy: { id: 'desc' },
    take: 5,
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
    console.log(`Receipt ID: ${r.id}, Code: ${r.batch_code}, QC Count: ${qc?.length}`);
    if (qc && qc.length > 0) {
      console.log(`  QC: Moisture=${qc[0].moisture_value}, Density=${qc[0].density_value}, Grade=${qc[0].final_grade}, Green=${qc[0].green_percentage}`);
    } else {
        console.log(`  No QC Data!`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
