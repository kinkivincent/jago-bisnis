import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  createGeneration: vi.fn(),
  getProject: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./db", () => ({
  createGeneration: mocks.createGeneration,
  getProject: mocks.getProject,
}));

import { appRouter } from "./routers";

const testUser = {
  id: 987654,
  openId: "agent-smoke-test-user",
  name: "Agent Test",
  email: "agent-test@example.invalid",
  loginMethod: "test",
  businessName: "Test UMKM",
  businessCategory: "Retail",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00Z"),
};

const ctx: TrpcContext = {
  user: testUser,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const smokeCases = [
  { agent: "Ads AI", category: "ads", tool: "facebook_ads" },
  { agent: "Video Ads AI", category: "video", tool: "video_script" },
  { agent: "Marketing AI", category: "marketing", tool: "marketing_strategy" },
  { agent: "Marketplace AI", category: "marketplace", tool: "shopee_listing" },
  { agent: "Affiliate AI", category: "affiliate", tool: "affiliate_hook" },
] as const;

describe("AI agent generation smoke tests (mocked; no model calls or database writes)", () => {
  beforeEach(() => {
    mocks.invokeLLM.mockReset();
    mocks.createGeneration.mockReset();
    mocks.getProject.mockReset();
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "Mock output: brief diproses dengan sukses." } }] });
    mocks.createGeneration.mockImplementation(async (input: { userId: number; projectId?: number; category: string; tool: string; title: string; data: string; result: string }) => ({
      id: 42,
      userId: input.userId,
      projectId: input.projectId ?? null,
      category: input.category,
      tool: input.tool,
      title: input.title,
      input: input.data,
      result: input.result,
      createdAt: new Date("2026-11-17T00:00:00Z"),
    }));
  });

  it.each(smokeCases)("$agent accepts a brief and returns generated output", async ({ category, tool }) => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generate({
      category,
      tool,
      businessName: "Test UMKM",
      productName: "Produk contoh",
      audience: "Pelanggan baru",
      objective: "Menyusun draft awal",
      details: "Buat output yang relevan untuk brief pengujian ini.",
    });

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM.mock.calls[0]?.[0]).toMatchObject({
      messages: expect.arrayContaining([expect.objectContaining({ role: "user", content: expect.stringContaining(`Jenis output:`) })]),
    });
    expect(mocks.createGeneration).toHaveBeenCalledWith(expect.objectContaining({
      userId: testUser.id,
      category,
      tool,
      result: "Mock output: brief diproses dengan sukses.",
    }));
    expect(result).toMatchObject({
      category,
      tool,
      result: "Mock output: brief diproses dengan sukses.",
    });
  });
});
