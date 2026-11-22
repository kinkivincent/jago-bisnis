import { describe, expect, it } from "vitest";
import {
  getMissingDailyBriefSources,
  SALES_DAILY_BRIEF_SOURCE_STAGES,
} from "../shared/salesAgents";
import { buildDailyBriefPrompt, removeBriefUrls } from "./salesMorningBrief";

const savedAt = new Date("2026-11-21T02:00:00.000Z");

describe("Daily Brief Pagi source guardrails", () => {
  it("requires all four saved recommendation stages", () => {
    expect(getMissingDailyBriefSources([])).toEqual([...SALES_DAILY_BRIEF_SOURCE_STAGES]);
    expect(getMissingDailyBriefSources([
      "opportunity_report",
      "ads_recommendation",
      "video_recommendation",
    ])).toEqual(["campaign_recommendation"]);
    expect(getMissingDailyBriefSources(SALES_DAILY_BRIEF_SOURCE_STAGES)).toEqual([]);
  });

  it("keeps recorded target context, marks missing omzet, and never sends a Lynk URL to the model", () => {
    const destinationUrl = "https://lynk.id/toko-pengguna";
    const prompt = buildDailyBriefPrompt({
      agentName: "Sales Agent A",
      category: "Fashion Muslim",
      productName: "Produk yang dicatat pengguna",
      targetAudience: null,
      targetRevenue: 1_000_000,
      actualRevenue: null,
      salesLinkConfigured: true,
      dateLabel: "Sabtu, 21 November 2026",
      destinationUrl,
      sources: SALES_DAILY_BRIEF_SOURCE_STAGES.map(stage => ({
        stage,
        result: `Rekomendasi tersimpan untuk ditinjau. Tautan: ${destinationUrl}`,
        createdAt: savedAt,
      })),
    });

    expect(prompt).toContain("Rp1.000.000");
    expect(prompt).toContain("Omzet aktual belum dicatat pengguna");
    expect(prompt).toContain("Target audiens: Belum dicatat pengguna");
    expect(prompt).toContain("[URL Sales Link disembunyikan]");
    expect(prompt).not.toContain(destinationUrl);
    expect(prompt).not.toContain("Sisa menuju target berdasarkan angka yang dicatat pengguna");
  });

  it("removes links from generated output before it is saved", () => {
    expect(removeBriefUrls("Buka https://lynk.id/toko untuk melihat tautan."))
      .toBe("Buka [URL disembunyikan] untuk melihat tautan.");
    expect(removeBriefUrls("Tautan Lynk: lynk.id/toko-pengguna"))
      .toBe("Tautan Lynk: [URL disembunyikan]");
  });
});
