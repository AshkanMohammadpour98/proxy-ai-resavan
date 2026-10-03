// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

// استفاده از Edge Runtime برای سرعت بالاتر و کمترین تاخیر (Latency)
export const runtime = "edge";

const TARGET_BASE_URL = "https://openrouter.ai/api/v1";

export async function GET(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function POST(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxyRequest(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function handleProxyRequest(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // استخراج مسیر مانند /chat/completions
    const subPath = url.pathname.replace(/^\/api\/proxy/, "");
    const targetUrl = `${TARGET_BASE_URL}${subPath}${url.search}`;

    const forwardHeaders = new Headers(req.headers);
    forwardHeaders.delete("host");

    const requestBody = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer();

    // ارسال مستقیم درخواست از ورسل به OpenRouter
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: requestBody,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Vercel Proxy Error:", error);
    return NextResponse.json(
      { error: "خطا در ارتباط پروکسی با OpenRouter", details: error.message },
      { status: 500 }
    );
  }
}