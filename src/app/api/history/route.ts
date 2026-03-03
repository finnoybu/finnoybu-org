import { NextRequest, NextResponse } from "next/server";
import { getSnapshotHistory } from "@/lib/storage";
import {
  badRequest,
  enforceRateLimit,
  getRequestId,
  internalError,
  logServerError,
} from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const requestId = getRequestId();

  const rateLimited = enforceRateLimit(request, requestId);
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const domain = request.nextUrl.searchParams.get("domain");

    if (!domain) {
      return badRequest("Domain query parameter is required", requestId);
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const snapshots = await getSnapshotHistory(normalizedDomain);

    return NextResponse.json({ domain: normalizedDomain, snapshots });
  } catch (error) {
    logServerError(requestId, "History API error", error);
    return internalError("Failed to retrieve snapshot history", requestId);
  }
}
