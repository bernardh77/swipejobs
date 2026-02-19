import { NextResponse } from "next/server";

const API_BASE = "https://test.swipejobs.com";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: { workerId: string; jobId: string; decision: string } }
) {
  const decision = params.decision.toLowerCase();
  if (decision !== "accept" && decision !== "reject") {
    return NextResponse.json(
      { message: "Invalid decision." },
      { status: 400 }
    );
  }

  const target = `${API_BASE}/api/worker/${params.workerId}/job/${params.jobId}/${decision}`;
  const response = await fetch(target, { method: "GET" });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
