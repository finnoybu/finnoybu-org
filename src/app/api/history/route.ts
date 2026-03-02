import { NextRequest, NextResponse } from "next/server";
import { getSnapshotHistory } from "@/lib/storage";

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
    const snapshots = await getSnapshotHistory(normalizedDomain);

    return NextResponse.json({ domain: normalizedDomain, snapshots });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve snapshot history", details: String(error) },
      { status: 500 }
    );
  }
}
