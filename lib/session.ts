// Assinatura/validação do cookie de sessão. Sem dependências de Prisma
// para poder ser usado no proxy.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "volei_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type SessionPayload = {
  sub: string;
  mcp: boolean; // mustChangePassword no momento em que o cookie foi emitido
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET não definido.");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ mcp: payload.mcp })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, mcp: payload.mcp === true };
  } catch {
    return null;
  }
}
