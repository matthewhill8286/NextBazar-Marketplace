import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/shop-description/route";

// ---------------------------------------------------------------------------
// Mock OpenAI
// ---------------------------------------------------------------------------

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}));

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/ai/shop-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "Welcome to Saiyan Motorsport — your destination for premium vehicles.",
        },
      },
    ],
  });
});

describe("POST /api/ai/shop-description", () => {
  it("returns 400 when shopName is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Shop name is required");
  });

  it("returns 200 with generated description", async () => {
    const res = await POST(makeRequest({ shopName: "Saiyan Motorsport" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toContain("Saiyan Motorsport");
  });

  it("uses a 'write new' prompt when no currentDescription is provided", async () => {
    await POST(makeRequest({ shopName: "Test Shop" }));

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: any) => m.role === "user",
    );
    expect(userMessage.content).toContain("Write a short");
    expect(userMessage.content).toContain("Test Shop");
    expect(userMessage.content).not.toContain("Improve");
  });

  it("uses an 'improve' prompt when currentDescription is provided", async () => {
    await POST(
      makeRequest({
        shopName: "Test Shop",
        currentDescription: "We sell cars.",
      }),
    );

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: any) => m.role === "user",
    );
    expect(userMessage.content).toContain("Improve");
    expect(userMessage.content).toContain("We sell cars.");
  });

  it("uses gpt-4o-mini model with correct temperature", async () => {
    await POST(makeRequest({ shopName: "Shop" }));
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4o-mini");
    expect(callArgs.temperature).toBe(0.7);
    expect(callArgs.max_tokens).toBe(200);
  });

  it("sends a system message with copywriter context", async () => {
    await POST(makeRequest({ shopName: "Shop" }));
    const callArgs = mockCreate.mock.calls[0][0];
    const sysMessage = callArgs.messages.find(
      (m: any) => m.role === "system",
    );
    expect(sysMessage.content).toContain("copywriter");
  });

  it("returns 500 when OpenAI throws", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Rate limit exceeded"));
    const res = await POST(makeRequest({ shopName: "Shop" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns empty string when OpenAI returns null content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });
    const res = await POST(makeRequest({ shopName: "Shop" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toBe("");
  });
});
