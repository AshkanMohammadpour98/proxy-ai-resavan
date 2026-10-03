export const config = {
  runtime: "edge",
};

const TARGET_BASE_URL = "https://openrouter.ai/api/v1";
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

// هدرهای CORS
// نکته: مقدار "*" برای Access-Control-Allow-Headers شامل Authorization نمی‌شود،
// به همین دلیل هدرهای درخواستی مرورگر را عیناً برمی‌گردانیم.
function corsHeaders(req) {
  const requested = req.headers.get("access-control-request-headers");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers":
      requested || "Authorization, Content-Type, HTTP-Referer, X-Title, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req) {
  const cors = corsHeaders(req);

  // پاسخ به Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!ALLOWED_METHODS.includes(req.method)) {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  try {
    const url = new URL(req.url);
    const subPath = url.pathname.replace(/^\/api\/proxy/, "");
    const targetUrl = `${TARGET_BASE_URL}${subPath}${url.search}`;

    // انتقال همه هدرها (از جمله Authorization) به‌جز هدرهای مختص زیرساخت
    const forwardHeaders = new Headers();
    for (const [key, value] of req.headers.entries()) {
      const k = key.toLowerCase();
      if (
        k === "host" ||
        k === "connection" ||
        k === "content-length" ||
        k === "forwarded" ||
        k === "x-real-ip" ||
        k.startsWith("x-forwarded-") ||
        k.startsWith("x-vercel-")
      ) {
        continue;
      }
      forwardHeaders.set(key, value);
    }

    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
    });

    // بدنه توسط fetch از حالت فشرده خارج شده؛ این هدرها باید حذف شوند
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    for (const [k, v] of Object.entries(cors)) {
      responseHeaders.set(k, v);
    }

    // response.body به‌صورت stream برگردانده می‌شود (پشتیبانی از stream: true)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Proxy Execution Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors } }
    );
  }
}
