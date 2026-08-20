export class NextRequest extends Request {
  nextUrl: URL;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (input instanceof Request) {
      super(input, init);
    } else {
      super(url, init);
    }
    this.nextUrl = new URL(url);
  }
}

export const NextResponse = {
  json(body: unknown, init?: ResponseInit) {
    return Response.json(body, init);
  },
  redirect(url: string | URL, status: number = 302) {
    return new Response(null, {
      status,
      headers: { Location: String(url) },
    });
  },
  next() {
    return new Response(null, { status: 200 });
  },
  rewrite(url: string | URL) {
    return new Response(null, {
      status: 200,
      headers: { "x-middleware-rewrite": String(url) },
    });
  },
};

export function asNextRequest(request: Request): NextRequest {
  if (request instanceof NextRequest) return request;
  return new NextRequest(request);
}
