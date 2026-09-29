import { connection } from "next/server";
import { db } from "@/lib/db";

export async function getSettings() {
  await connection();
  const settings = await db.appSettings.findUnique({ where: { id: 1 } });
  return settings ?? { id: 1, clubName: "Vôlei", lightTheme: "light", darkTheme: "dark" };
}
