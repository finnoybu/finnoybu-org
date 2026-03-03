import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/storage";
import {
  badRequest,
  enforceRateLimit,
  getRequestId,
  internalError,
  logServerError,
  notFound,
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
    const snapshot = await getLatestSnapshot(normalizedDomain);

    if (!snapshot) {
      return notFound("No snapshot found for domain", requestId);
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    logServerError(requestId, "Latest snapshot API error", error);
    return internalError("Failed to retrieve latest snapshot", requestId);
  }
}
