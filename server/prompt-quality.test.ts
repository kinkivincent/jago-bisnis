import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeLLM: vi.fn(), createGeneration: vi.fn(), getProject: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./db", () => ({ createGeneration: mocks.createGeneration, getProject: mocks.getProject }));

import { buildPrompt, systemPrompt } from "./routers";

const promptCases = [
  { agent: "Ads AI", category: "ads" as const, tool: "facebook_ads" as const },
  { agent: "Ads AI", category: "ads" as const, tool: "instagram_ads" as const },
  { agent: "Ads AI", category: "ads" as const, tool: "whatsapp_ads" as const },
  { agent: "Ads AI", category: "ads" as const, tool: "cta_generator" as const },
  { agent: "Video AI", category: "video" as const, tool: "video_script" as const },
  { agent: "Video AI", category: "video" as const, tool: "storyboard" as const },
  { agent: "Video AI", category: "video" as const, tool: "visual_hook" as const },
  { agent: "Video AI", category: "video" as const, tool: "voice_over" as const },
  { agent: "Marketing AI", category: "marketing" as const, tool: "marketing_strategy" as const },
  { agent: "Marketing AI", category: "marketing" as const, tool: "content_calendar" as const },
  { agent: "Marketing AI", category: "marketing" as const, tool: "promotion_ideas" as const },
  { agent: "Marketing AI", category: "marketing" as const, tool: "campaign_planner" as const },
  { agent: "Marketing AI", category: "marketing" as const, tool: "funnel_builder" as const },
  { agent: "Marketplace AI", category: "marketplace" as const, tool: "shopee_listing" as const },
  { agent: "Marketplace AI", category: "marketplace" as const, tool: "tokopedia_listing" as const },
  { agent: "Marketplace AI", category: "marketplace" as const, tool: "tiktok_shop_listing" as const },
  { agent: "Marketplace AI", category: "marketplace" as const, tool: "seo_product" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_product_finder" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_hook" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_review_script" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_caption" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_cta" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_content_calendar" as const },
  { agent: "Affiliate AI", category: "affiliate" as const, tool: "affiliate_live_script" as const },
];

const makeInput = (item: (typeof promptCases)[number]) => ({
  ...item,
  platform: "",
  projectId: null,
  businessName: "",
  businessCategory: "",
  productName: "",
  audience: "",
  objective: "",
  tone: "Ramah dan persuasif",
  details: "",
});

describe("V1.1 prompt quality guardrails", () => {
  it("forbids unsupported facts and prescribes neutral missing-data handling", () => {
    expect(systemPrompt).toContain("Jangan membuat fakta, angka, spesifikasi, pengalaman pengguna, testimonial, atau KPI yang tidak diberikan pengguna.");
    expect(systemPrompt).toContain("jelaskan bahwa informasi tidak tersedia, gunakan bahasa netral, dan berikan placeholder yang harus diisi pengguna");
    expect(systemPrompt.toLowerCase()).not.toContain("gunakan asumsi wajar");
  });

  it.each(promptCases)("passes unavailable fields to $agent / $tool instead of inventing defaults", item => {
    const { context, instruction } = buildPrompt(makeInput(item));
    expect(context).toContain("Nama bisnis: Tidak diberikan oleh pengguna");
    expect(context).toContain("Target audiens: Tidak diberikan oleh pengguna");
    expect(context).toContain("Field terstruktur yang tidak diberikan pengguna:");
    expect(context).toContain("gunakan bahasa netral, dan beri placeholder yang harus diisi pengguna");
    expect(instruction.toLowerCase()).not.toContain("gunakan asumsi wajar");
  });

  it("does not request fabricated first-person experience from Affiliate AI", () => {
    const { instruction } = buildPrompt(makeInput({ agent: "Affiliate AI", category: "affiliate", tool: "affiliate_hook" }));
    expect(instruction).toContain("Jangan gunakan pengalaman personal atau sudut pandang orang pertama kecuali diberikan pengguna");
    expect(instruction).toContain("placeholder yang harus diisi kreator");
  });
});
