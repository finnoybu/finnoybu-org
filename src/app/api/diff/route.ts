import { NextRequest, NextResponse } from "next/server";
import { getDomainDiff } from "@/lib/storage";

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
    const diffs = await getDomainDiff(normalizedDomain);

    return NextResponse.json(diffs);
  } catch (error) {
    console.error("Diff API error:", error);
    return NextResponse.json(
      { error: "Failed to compute diff", details: String(error) },
      { status: 500 }
    );
  }
}
