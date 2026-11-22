import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { SALES_DAILY_BRIEF_SOURCE_STAGES, SALES_DAILY_BRIEF_STAGE } from "../shared/salesAgents";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  createGeneration: vi.fn(),
  getSalesAgentProduct: vi.fn(),
  getSalesAgentWorkspace: vi.fn(),
  getDailyBriefSources: vi.fn(),
  getGeneration: vi.fn(),
  listSalesAgentGenerations: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./db", () => ({
  createGeneration: mocks.createGeneration,
  getSalesAgentProduct: mocks.getSalesAgentProduct,
  getSalesAgentWorkspace: mocks.getSalesAgentWorkspace,
  getDailyBriefSources: mocks.getDailyBriefSources,
  getGeneration: mocks.getGeneration,
  listSalesAgentGenerations: mocks.listSalesAgentGenerations,
}));

import { appRouter } from "./routers";

const user = {
  id: 54,
  openId: "daily-brief-router-test",
  name: "Test User",
  email: "daily-brief@example.invalid",
  loginMethod: "test",
  businessName: null,
  businessCategory: null,
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00Z"),
};

const context: TrpcContext = { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
const destinationUrl = "https://lynk.id/private-destination";
const savedSources = SALES_DAILY_BRIEF_SOURCE_STAGES.map((stage, index) => ({
  id: index + 1,
  stage,
  result: `Rekomendasi tersimpan dari ${stage}. URL: ${destinationUrl}`,
  createdAt: new Date("2026-11-20T03:00:00Z"),
}));

describe("sales.agents.generateDailyBrief (mocked; no real model call or database writes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSalesAgentProduct.mockResolvedValue({
      id: 29,
      name: "Produk pengguna",
      targetAudience: null,
      salesAgentKey: "A",
    });
    mocks.getSalesAgentWorkspace.mockResolvedValue({
      key: "A",
      name: "Sales Agent A",
      category: "Fashion Muslim",
      targetRevenue: 1_000_000,
      targetRevenueRecorded: false,
      actualRevenue: null,
      destinationUrl,
    });
    mocks.getDailyBriefSources.mockResolvedValue(savedSources);
    mocks.listSalesAgentGenerations.mockResolvedValue([{ workflowStage: "daily_brief" }]);
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "## Fokus hari ini\nTinjau materi yang sudah tersimpan." } }] });
    mocks.createGeneration.mockImplementation(async (input: Record<string, unknown>) => ({
      id: 88,
      ...input,
      createdAt: new Date("2026-11-21T02:00:00Z"),
    }));
  });

  it("synthesizes only the same user's track/product sources, redacts Lynk, and saves a distinct history item", async () => {
    const caller = appRouter.createCaller(context);
    const result = await caller.sales.agents.generateDailyBrief({ agentKey: "A", productId: 29 });

    expect(mocks.getSalesAgentProduct).toHaveBeenCalledWith(user.id, 29);
    expect(mocks.getDailyBriefSources).toHaveBeenCalledWith(user.id, "A", 29);
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    const prompt = mocks.invokeLLM.mock.calls[0]?.[0].messages[1].content as string;
    expect(prompt).toContain("Opportunity Report");
    expect(prompt).toContain("Campaign Recommendation");
    expect(prompt).toContain("Ads Recommendation");
    expect(prompt).toContain("Video Recommendation");
    expect(prompt).toContain("Target omzet track belum dicatat pengguna");
    expect(prompt).not.toContain("Target omzet track yang dicatat pengguna: Rp1.000.000");
    expect(prompt).not.toContain(destinationUrl);
    expect(mocks.createGeneration).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      salesAgentKey: "A",
      salesProductId: 29,
      workflowStage: SALES_DAILY_BRIEF_STAGE,
      category: "marketing",
      tool: "sales_daily_brief",
      result: "## Fokus hari ini\nTinjau materi yang sudah tersimpan.",
    }));
    expect(result.id).toBe(88);
  });

  it("explains missing source stages without invoking AI or saving history", async () => {
    mocks.getDailyBriefSources.mockResolvedValue(savedSources.filter(source => source.stage !== "campaign_recommendation"));
    const caller = appRouter.createCaller(context);

    await expect(caller.sales.agents.generateDailyBrief({ agentKey: "A", productId: 29 }))
      .rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("Campaign Recommendation") });
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(mocks.createGeneration).not.toHaveBeenCalled();
  });

  it("does not pass an unsaved built-in target into prerequisite workflow recommendations", async () => {
    const caller = appRouter.createCaller(context);

    await caller.ai.generate({
      category: "marketplace",
      tool: "seo_product",
      productId: 29,
      salesAgentKey: "A",
      workflowStage: "opportunity_report",
      productName: "Produk pengguna",
    });

    const prompt = mocks.invokeLLM.mock.calls[0]?.[0].messages[1].content as string;
    expect(prompt).toContain("Target omzet track belum dicatat pengguna");
    expect(prompt).not.toContain("Rp1.000.000");
  });

  it("routes regeneration of saved Daily Brief history through the same scoped synthesis", async () => {
    mocks.getGeneration.mockResolvedValue({
      id: 77,
      userId: user.id,
      salesAgentKey: "A",
      salesProductId: 29,
      workflowStage: SALES_DAILY_BRIEF_STAGE,
      input: JSON.stringify({ type: SALES_DAILY_BRIEF_STAGE }),
    });
    const caller = appRouter.createCaller(context);

    await caller.ai.regenerate({ id: 77 });

    expect(mocks.getGeneration).toHaveBeenCalledWith(user.id, 77);
    expect(mocks.getDailyBriefSources).toHaveBeenCalledWith(user.id, "A", 29);
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.createGeneration).toHaveBeenCalledWith(expect.objectContaining({ workflowStage: SALES_DAILY_BRIEF_STAGE }));
  });
});
