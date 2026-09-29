import { Resend } from "resend";

// E-mail é opcional: sem RESEND_API_KEY, sendEmail vira no-op.
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export const emailEnabled = resend !== null;

export async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!resend) return { skipped: true as const };
  const from = process.env.EMAIL_FROM ?? "Vôlei <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) console.error("Falha ao enviar e-mail:", error);
  return { skipped: false as const, error };
}
