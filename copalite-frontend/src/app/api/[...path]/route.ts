import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function proxyRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const url = new URL(req.url);
  const search = url.search; // preserve query string
  const backendUrl = `${BACKEND_URL}/api/${path}${search}`;

  // Forward headers, strip host so backend sees its own host
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Read body for methods that carry one
  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  // Build response — explicitly forward ALL headers including Set-Cookie
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    resHeaders.append(key, value);
  });

  const resBody = await backendRes.arrayBuffer();

  return new NextResponse(resBody, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
