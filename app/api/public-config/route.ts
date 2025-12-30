import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const googleMapsKey =
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        "";

    return NextResponse.json(
        { googleMapsKey },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        }
    );
}
