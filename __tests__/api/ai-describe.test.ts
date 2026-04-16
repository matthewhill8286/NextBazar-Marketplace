import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/describe/route";
import { __resetRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Mock OpenAI — use vi.hoisted so the variable exists when vi.mock factory runs
// ---------------------------------------------------------------------------

const { mockCreate, mockGetUserId } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetUserId: vi.fn(async () => "user-123"),
}));

vi.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}));

// AI guard reads the user id from this helper — stub it to a fixed uid.
vi.mock("@/lib/auth/require-auth", () => ({
  getUserId: mockGetUserId,
  requireAuth: vi.fn(async () => ({ userId: await mockGetUserId() })),
}));

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/ai/describe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetRateLimit();
  // The route early-returns 503 if OPENAI_API_KEY is not set
  process.env.OPENAI_API_KEY = "sk-test-key";
  mockGetUserId.mockResolvedValue("user-123");
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: "A great listing description." } }],
  });
});

describe("POST /api/ai/describe", () => {
  it("returns 400 when title is missing", async () => {
    const res = await POST(makeRequest({ category: "Electronics" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Title is required");
  });

  it("returns 200 with generated description for a text-only request", async () => {
    const res = await POST(
      makeRequest({ title: "iPhone 14 Pro", category: "Electronics" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toBe("A great listing description.");
  });

  it("calls OpenAI with a text-only message when no imageUrl is provided", async () => {
    await POST(makeRequest({ title: "Sofa", condition: "used_good" }));
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user");
    expect(typeof userMessage.content).toBe("string");
    expect(userMessage.content).toContain("Sofa");
  });

  it("calls OpenAI with a vision (multipart) message when imageUrl is provided", async () => {
    await POST(
      makeRequest({
        title: "Camera",
        imageUrl: "https://example.com/camera.jpg",
      }),
    );
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user");
    expect(Array.isArray(userMessage.content)).toBe(true);
    const imageBlock = userMessage.content.find(
      (b: any) => b.type === "image_url",
    );
    expect(imageBlock.image_url.url).toBe("https://example.com/camera.jpg");
  });

  it("includes condition and price in the prompt when provided", async () => {
    await POST(
      makeRequest({
        title: "Laptop",
        condition: "like_new",
        price: 1200,
        category: "Electronics",
      }),
    );
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user");
    const content =
      typeof userMessage.content === "string"
        ? userMessage.content
        : userMessage.content[0].text;
    expect(content).toContain("like_new");
    expect(content).toContain("1200");
  });

  it("returns 500 when OpenAI throws an error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("OpenAI quota exceeded"));
    const res = await POST(makeRequest({ title: "Watch" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("OpenAI quota exceeded");
  });

  it("uses gpt-4o-mini model", async () => {
    await POST(makeRequest({ title: "Bike" }));
    expect(mockCreate.mock.calls[0][0].model).toBe("gpt-4o-mini");
  });
});
