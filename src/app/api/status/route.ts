import { NextRequest, NextResponse } from "next/server";
import { getDomainStatus } from "@/lib/storage";

/**
 * GET /api/status?domain=<domain>
 *
 * Computes the stability classification for a domain by:
 * 1. Retrieving the latest diff between snapshots
 * 2. Applying classification rules
 * 3. Returning status (stable | drift | risk) and triggered signals
 *
 * Returns 400 if domain parameter is missing.
 * Returns 500 on server error.
 */
export async function GET(request: NextRequest) {
  try {
    const domain = request.nextUrl.searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "domain parameter is required" },
        { status: 400 }
      );
    }

    const status = await getDomainStatus(domain.toLowerCase().trim());

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error computing domain status:", error);
    return NextResponse.json(
      { error: "Failed to compute domain status" },
      { status: 500 }
    );
  }
}
