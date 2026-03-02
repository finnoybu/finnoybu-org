import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const domain = request.nextUrl.searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain query parameter is required" },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const snapshot = await getLatestSnapshot(normalizedDomain);

    if (!snapshot) {
      return NextResponse.json(
        { error: "No snapshot found for domain" },
        { status: 404 }
      );
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Latest snapshot API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve latest snapshot", details: String(error) },
      { status: 500 }
    );
  }
}
