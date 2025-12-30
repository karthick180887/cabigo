import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/session";

function getBaseUrl(request: Request) {
    const envBase =
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.SITE_URL ??
        process.env.BASE_URL ??
        "";
    if (envBase) return envBase;

    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    if (forwardedHost) {
        return `${forwardedProto ?? "https"}://${forwardedHost}`;
    }

    const host = request.headers.get("host");
    if (host) {
        return `${forwardedProto ?? "https"}://${host}`;
    }

    return request.url;
}

export async function GET(request: Request) {
    const baseUrl = getBaseUrl(request);
    const response = NextResponse.redirect(new URL("/admin/login", baseUrl));
    response.cookies.set({
        name: ADMIN_SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
    return response;
}
