export const SALES_AGENT_KEYS = ["A", "B", "C"] as const;
export type SalesAgentKey = (typeof SALES_AGENT_KEYS)[number];

export const SALES_AGENT_DEFAULTS: ReadonlyArray<{
  key: SalesAgentKey;
  name: string;
  category: string;
  targetRevenue: number;
}> = [
  { key: "A", name: "Sales Agent A", category: "Fashion Muslim", targetRevenue: 1_000_000 },
  { key: "B", name: "Sales Agent B", category: "Produk Digital", targetRevenue: 5_000_000 },
  { key: "C", name: "Sales Agent C", category: "Affiliate", targetRevenue: 2_000_000 },
];

export const SALES_WORKFLOW_STAGES = [
  "daily_brief",
  "opportunity_report",
  "ads_recommendation",
  "video_recommendation",
  "campaign_recommendation",
] as const;
export type SalesWorkflowStage = (typeof SALES_WORKFLOW_STAGES)[number];

export const SALES_WORKFLOW_LABELS: Record<SalesWorkflowStage, string> = {
  daily_brief: "Daily Brief",
  opportunity_report: "Opportunity Report",
  ads_recommendation: "Ads Recommendation",
  video_recommendation: "Video Recommendation",
  campaign_recommendation: "Campaign Recommendation",
};

export const SALES_DAILY_BRIEF_STAGE = "daily_sales_brief" as const;
export const SALES_DAILY_BRIEF_LABEL = "Daily Brief Pagi";
export const SALES_DAILY_BRIEF_SOURCE_STAGES = [
  "opportunity_report",
  "campaign_recommendation",
  "ads_recommendation",
  "video_recommendation",
] as const satisfies readonly SalesWorkflowStage[];
export type SalesDailyBriefSourceStage = (typeof SALES_DAILY_BRIEF_SOURCE_STAGES)[number];

export const SALES_DAILY_BRIEF_SOURCE_LABELS: Record<SalesDailyBriefSourceStage, string> = {
  opportunity_report: SALES_WORKFLOW_LABELS.opportunity_report,
  campaign_recommendation: SALES_WORKFLOW_LABELS.campaign_recommendation,
  ads_recommendation: SALES_WORKFLOW_LABELS.ads_recommendation,
  video_recommendation: SALES_WORKFLOW_LABELS.video_recommendation,
};

export function getMissingDailyBriefSources(completedStages: Iterable<string>) {
  const completed = new Set(completedStages);
  return SALES_DAILY_BRIEF_SOURCE_STAGES.filter(stage => !completed.has(stage));
}
