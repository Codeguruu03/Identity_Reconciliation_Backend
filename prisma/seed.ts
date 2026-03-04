import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding image_reconcilation table...");

    // Clear existing data first
    await prisma.contact.deleteMany();
    console.log("🗑️  Cleared existing data");

    // --- Cluster 1: lorraine linked to multiple phones ---
    const c1 = await prisma.contact.create({
        data: { email: "lorraine@hillvalley.edu", phoneNumber: "123456", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "lorraine@hillvalley.edu", phoneNumber: "999999", linkedId: c1.id, linkPrecedence: "secondary" }
    });
    await prisma.contact.create({
        data: { email: "l.mcfly@hillvalley.edu", phoneNumber: "123456", linkedId: c1.id, linkPrecedence: "secondary" }
    });

    // --- Cluster 2: marty with multiple emails ---
    const c2 = await prisma.contact.create({
        data: { email: "marty@hillvalley.edu", phoneNumber: "555-0101", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "m.mcfly@future.com", phoneNumber: "555-0101", linkedId: c2.id, linkPrecedence: "secondary" }
    });
    await prisma.contact.create({
        data: { email: "marty.mcfly@gmail.com", phoneNumber: "555-0102", linkedId: c2.id, linkPrecedence: "secondary" }
    });

    // --- Cluster 3: george ---
    const c3 = await prisma.contact.create({
        data: { email: "george@hillvalley.edu", phoneNumber: "919191", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "georgemcfly@gmail.com", phoneNumber: "919191", linkedId: c3.id, linkPrecedence: "secondary" }
    });

    // --- Cluster 4: doc brown ---
    const c4 = await prisma.contact.create({
        data: { email: "doc.brown@delorean.com", phoneNumber: "888-1985", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "emmett.brown@hillvalley.edu", phoneNumber: "888-1985", linkedId: c4.id, linkPrecedence: "secondary" }
    });
    await prisma.contact.create({
        data: { email: "doc@delorean.io", phoneNumber: "888-2015", linkedId: c4.id, linkPrecedence: "secondary" }
    });
    await prisma.contact.create({
        data: { email: "brown.e@1885.com", phoneNumber: "888-1885", linkedId: c4.id, linkPrecedence: "secondary" }
    });

    // --- Cluster 5: biff (standalone) ---
    await prisma.contact.create({
        data: { email: "biff.tannen@hillvalley.edu", phoneNumber: "717171", linkPrecedence: "primary" }
    });

    // --- Cluster 6: jennifer ---
    const c6 = await prisma.contact.create({
        data: { email: "jennifer@hillvalley.edu", phoneNumber: "555-0200", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "jennifer.parker@gmail.com", phoneNumber: "555-0201", linkedId: c6.id, linkPrecedence: "secondary" }
    });

    // --- Cluster 7: needles (standalone) ---
    await prisma.contact.create({
        data: { email: "needles@hillvalley.edu", phoneNumber: "333-0999", linkPrecedence: "primary" }
    });

    // --- Cluster 8: strickland ---
    const c8 = await prisma.contact.create({
        data: { email: "strickland@hillvalley-school.edu", phoneNumber: "444-0001", linkPrecedence: "primary" }
    });
    await prisma.contact.create({
        data: { email: "gerald.strickland@gmail.com", phoneNumber: "444-0001", linkedId: c8.id, linkPrecedence: "secondary" }
    });

    const count = await prisma.contact.count();
    console.log(`✅ Done! ${count} records inserted into image_reconcilation.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
