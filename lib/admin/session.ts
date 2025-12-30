import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export const ADMIN_SESSION_COOKIE_NAME = "cabigo_admin_session";
const COOKIE_NAME = ADMIN_SESSION_COOKIE_NAME;
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error("Missing ADMIN_SESSION_SECRET for admin sessions.");
    }
    return secret;
}

function sign(value: string) {
    return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(username: string) {
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const payload = `${username}:${expiresAt}`;
    const signature = sign(payload);
    return `${payload}:${signature}`;
}

function decodeSession(token: string) {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [username, expiresAtRaw, signature] = parts;
    const payload = `${username}:${expiresAtRaw}`;
    if (sign(payload) !== signature) return null;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

    return { username, expiresAt };
}

export async function setAdminSession(username: string) {
    const token = encodeSession(username);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
}

export async function clearAdminSession() {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
}

export async function getAdminSession() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return decodeSession(token);
    } catch (error) {
        return null;
    }
}

export async function requireAdminSession() {
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }
    return session;
}
