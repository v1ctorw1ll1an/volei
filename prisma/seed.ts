import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Admin";
  if (!email || !password) {
    throw new Error("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD.");
  }

  await db.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Superadmin ${email} já existe — nada a fazer.`);
    return;
  }
  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "SUPERADMIN",
      mustChangePassword: true,
    },
  });
  console.log(`Superadmin ${email} criado. A senha deve ser trocada no primeiro login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
