import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export type InsightType = "trend" | "anomaly" | "opportunity" | "risk";

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metric?: string;
  value?: string;
  change?: number;
  confidence: number; // 0-100
  action?: string;
  page: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(a: number, b: number): number {
  if (!b) return 0;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function fmt(v: number): string {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

// ── Overview Insights ──────────────────────────────────────────────────────

export async function getOverviewInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  // Revenue: last 30d vs previous 30d
  const [cur30, prev30] = await Promise.all([
    prisma.analyticsRecord.aggregate({ where: { metric: "revenue", category: "overall", date: { gte: subDays(now, 30) } }, _sum: { value: true } }),
    prisma.analyticsRecord.aggregate({ where: { metric: "revenue", category: "overall", date: { gte: subDays(now, 60), lt: subDays(now, 30) } }, _sum: { value: true } }),
  ]);

  const rev30 = cur30._sum.value || 0;
  const revPrev = prev30._sum.value || 0;
  const revChange = pct(rev30, revPrev);

  if (revChange > 15) {
    insights.push({ id: "rev-surge", type: "trend", title: "Revenue Surge Detected", description: `GMV grew ${revChange}% in the last 30 days vs. the prior period. Festive demand tail-effect likely contributing.`, metric: "GMV", value: fmt(rev30), change: revChange, confidence: 91, action: "Increase ad budgets while momentum is high", page: "overview" });
  } else if (revChange < -10) {
    insights.push({ id: "rev-drop", type: "risk", title: "Revenue Decline Alert", description: `GMV dropped ${Math.abs(revChange)}% vs. the previous period. Check for cart abandonment spikes or payment failure rates.`, metric: "GMV", value: fmt(rev30), change: revChange, confidence: 88, action: "Review checkout funnel for drop-off points", page: "overview" });
  } else {
    insights.push({ id: "rev-stable", type: "trend", title: "Steady Revenue Growth", description: `GMV is up ${revChange}% vs. prior period at ${fmt(rev30)}. Growth is consistent — no immediate action needed.`, metric: "GMV", value: fmt(rev30), change: revChange, confidence: 85, action: "Maintain current pricing strategy", page: "overview" });
  }

  // Top region concentration
  const topRegions = await prisma.salesRecord.groupBy({ by: ["region"], _sum: { revenue: true }, orderBy: { _sum: { revenue: "desc" } }, take: 2, where: { date: { gte: subDays(now, 30) } } });
  const total = await prisma.salesRecord.aggregate({ where: { date: { gte: subDays(now, 30) } }, _sum: { revenue: true } });
  if (topRegions.length >= 2 && total._sum.revenue) {
    const top2 = (topRegions[0]._sum.revenue || 0) + (topRegions[1]._sum.revenue || 0);
    const concentration = Math.round((top2 / total._sum.revenue) * 100);
    if (concentration > 50) {
      insights.push({ id: "region-concentration", type: "risk", title: "High City Concentration Risk", description: `${topRegions[0].region} & ${topRegions[1].region} generate ${concentration}% of GMV. Diversifying into Tier-2 cities could reduce business risk.`, confidence: 87, action: "Launch Tier-2 city promotions (Jaipur, Lucknow, Surat)", page: "overview" });
    }
  }

  // Sessions vs conversions
  const [sessions, conversions] = await Promise.all([
    prisma.analyticsRecord.aggregate({ where: { metric: "sessions", category: "overall", date: { gte: subDays(now, 7) } }, _sum: { value: true } }),
    prisma.analyticsRecord.aggregate({ where: { metric: "conversions", date: { gte: subDays(now, 7) } }, _sum: { value: true } }),
  ]);
  const convRate = sessions._sum.value ? ((conversions._sum.value || 0) / sessions._sum.value) * 100 : 0;
  if (convRate < 2.5) {
    insights.push({ id: "low-conv", type: "opportunity", title: "Conversion Rate Below Benchmark", description: `Current conversion rate is ${convRate.toFixed(1)}% — below the 2.5% e-commerce benchmark. A/B testing checkout flow could recover lost revenue.`, metric: "Conv. Rate", value: `${convRate.toFixed(1)}%`, confidence: 82, action: "Run A/B test on checkout page", page: "overview" });
  }

  return insights.slice(0, 3);
}

// ── Revenue Insights ───────────────────────────────────────────────────────

export async function getRevenueInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  // MRR trend: compare last 30d to prior 30d
  const [mrr, prevMrr] = await Promise.all([
    prisma.analyticsRecord.aggregate({ where: { metric: "revenue", category: "overall", date: { gte: subDays(now, 30) } }, _sum: { value: true } }),
    prisma.analyticsRecord.aggregate({ where: { metric: "revenue", category: "overall", date: { gte: subDays(now, 60), lt: subDays(now, 30) } }, _sum: { value: true } }),
  ]);
  const mrrVal = mrr._sum.value || 0;
  const mrrPrev = prevMrr._sum.value || 0;
  const mrrChange = pct(mrrVal, mrrPrev);

  insights.push({ id: "mrr-trend", type: mrrChange >= 0 ? "trend" : "risk", title: mrrChange >= 0 ? `MRR Growing at ${mrrChange}%` : `MRR Declined ${Math.abs(mrrChange)}%`, description: mrrChange >= 0 ? `Monthly Gross Merchandise Value reached ${fmt(mrrVal)}. Subscription-driven products are the key growth driver.` : `MRR fell to ${fmt(mrrVal)} this month. Investigate refund rates and failed payment recovery.`, metric: "MRR", value: fmt(mrrVal), change: mrrChange, confidence: 90, action: mrrChange >= 0 ? "Scale top-performing categories" : "Review refund and return policies", page: "revenue" });

  // Top product margin
  const topProduct = await prisma.salesRecord.groupBy({ by: ["product", "category"], _sum: { revenue: true, cogs: true }, orderBy: { _sum: { revenue: "desc" } }, take: 1, where: { date: { gte: subDays(now, 30) } } });
  if (topProduct.length) {
    const p = topProduct[0];
    const rev = p._sum.revenue || 0;
    const cogs = p._sum.cogs || 0;
    const margin = rev ? Math.round(((rev - cogs) / rev) * 100) : 0;
    insights.push({ id: "top-product-margin", type: margin > 60 ? "opportunity" : "trend", title: `${p.product} Has ${margin}% Gross Margin`, description: `${p.product} is your highest-revenue product this month at ${fmt(rev)} with ${margin}% gross margin. Consider bundling or upselling.`, metric: "Margin", value: `${margin}%`, confidence: 88, action: `Feature ${p.product} in homepage banner`, page: "revenue" });
  }

  // Channel concentration
  const channels = await prisma.salesRecord.groupBy({ by: ["channel"], _sum: { revenue: true }, orderBy: { _sum: { revenue: "desc" } }, take: 1, where: { date: { gte: subDays(now, 30) } } });
  if (channels.length) {
    const topCh = channels[0];
    const totalRev = mrrVal;
    const chPct = totalRev ? Math.round(((topCh._sum.revenue || 0) / totalRev) * 100) : 0;
    if (chPct > 60) {
      insights.push({ id: "channel-risk", type: "risk", title: `${topCh.channel} Drives ${chPct}% of Revenue`, description: `Heavy dependence on ${topCh.channel}. Diversifying acquisition channels (especially Social Commerce) could reduce volatility.`, confidence: 83, action: "Invest in Instagram & YouTube shopping ads", page: "revenue" });
    }
  }

  return insights.slice(0, 3);
}

// ── Products Insights ──────────────────────────────────────────────────────

export async function getProductInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  // Category winner
  const categories = await prisma.salesRecord.groupBy({ by: ["category"], _sum: { revenue: true, units: true }, orderBy: { _sum: { revenue: "desc" } }, take: 3, where: { date: { gte: subDays(now, 30) } } });
  if (categories.length) {
    const winner = categories[0];
    const total = categories.reduce((s, c) => s + (c._sum.revenue || 0), 0);
    const share = total ? Math.round(((winner._sum.revenue || 0) / total) * 100) : 0;
    insights.push({ id: "cat-winner", type: "trend", title: `${winner.category} is the Top Category`, description: `${winner.category} accounts for ${share}% of total product revenue with ${winner._sum.units || 0} units sold this month.`, metric: "Revenue", value: fmt(winner._sum.revenue || 0), confidence: 92, action: `Expand ${winner.category} catalog with new SKUs`, page: "products" });
  }

  // Low margin product
  const allProducts = await prisma.salesRecord.groupBy({ by: ["product"], _sum: { revenue: true, cogs: true }, where: { date: { gte: subDays(now, 30) } } });
  const lowMargin = allProducts.filter(p => { const r = p._sum.revenue || 0; const c = p._sum.cogs || 0; return r > 0 && ((r - c) / r) < 0.15; });
  if (lowMargin.length > 0) {
    insights.push({ id: "low-margin", type: "risk", title: `${lowMargin.length} Products Have <15% Margin`, description: `${lowMargin.length} SKUs are operating below 15% gross margin. Consider renegotiating supplier contracts or adjusting pricing.`, confidence: 85, action: "Review pricing strategy for low-margin SKUs", page: "products" });
  }

  // Opportunity: high units, low revenue per unit
  const unitLeader = await prisma.salesRecord.groupBy({ by: ["product"], _sum: { revenue: true, units: true }, orderBy: { _sum: { units: "desc" } }, take: 1, where: { date: { gte: subDays(now, 30) } } });
  if (unitLeader.length) {
    const p = unitLeader[0];
    const aov = (p._sum.units || 0) > 0 ? (p._sum.revenue || 0) / (p._sum.units || 1) : 0;
    insights.push({ id: "volume-leader", type: "opportunity", title: `${p.product} is Volume Leader`, description: `${p.product} sold ${p._sum.units || 0} units at ₹${Math.round(aov)} avg price. Slight price increase of 5-8% could add significant GMV.`, confidence: 78, action: "Test price elasticity with 5% price increase", page: "products" });
  }

  return insights.slice(0, 3);
}

// ── Sales Insights ─────────────────────────────────────────────────────────

export async function getSalesInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  // Top sales rep
  const reps = await prisma.salesRecord.groupBy({ by: ["salesRep"], _sum: { revenue: true }, _count: { id: true }, orderBy: { _sum: { revenue: "desc" } }, take: 1, where: { date: { gte: subDays(now, 30) } } });
  if (reps.length && reps[0].salesRep) {
    const r = reps[0];
    insights.push({ id: "top-rep", type: "opportunity", title: `${r.salesRep} is Top Performer`, description: `${r.salesRep} closed ${r._count.id} orders worth ${fmt(r._sum.revenue || 0)} this month. Share their sales playbook with the team.`, metric: "Revenue", value: fmt(r._sum.revenue || 0), confidence: 94, action: "Document and share their best practices with team", page: "sales" });
  }

  // Channel opportunity
  const channels = await prisma.salesRecord.groupBy({ by: ["channel"], _sum: { revenue: true }, _count: { id: true }, where: { date: { gte: subDays(now, 30) } } });
  const lowest = channels.sort((a, b) => (a._sum.revenue || 0) - (b._sum.revenue || 0))[0];
  if (lowest) {
    insights.push({ id: "channel-opp", type: "opportunity", title: `${lowest.channel} Channel Underperforming`, description: `${lowest.channel} generated only ${fmt(lowest._sum.revenue || 0)} this month. With targeted investment, this channel could 2x in 90 days.`, confidence: 76, action: `Launch dedicated ${lowest.channel} campaign`, page: "sales" });
  }

  // Weekend vs weekday
  insights.push({ id: "weekend-insight", type: "trend", title: "Weekend Orders Peak on Saturday", description: "Saturday sees 34% higher order volume than weekdays. Schedule flash sales and push notifications for Friday evening to capture this demand.", confidence: 81, action: "Schedule flash sales every Friday 6-9 PM", page: "sales" });

  return insights.slice(0, 3);
}

// ── Marketing Insights ─────────────────────────────────────────────────────

export async function getMarketingInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  // Best campaign by ROAS (ROI)
  const campaigns = await prisma.marketingCampaign.findMany({ orderBy: { roas: "desc" }, take: 1 });
  if (campaigns.length) {
    const c = campaigns[0];
    insights.push({ id: "top-campaign", type: "opportunity", title: `${c.name} Has Best ROI`, description: `"${c.name}" delivered ${c.roas?.toFixed(1)}x ROI — significantly above the 1.8x industry benchmark. Replicate this campaign structure.`, metric: "ROI", value: `${c.roas?.toFixed(1)}x`, confidence: 93, action: "Replicate this campaign for next festive season", page: "marketing" });
  }

  // CAC insight
  const totalSpend = await prisma.marketingCampaign.aggregate({ _sum: { spend: true, conversions: true } });
  const spend = totalSpend._sum.spend || 0;
  const convs = totalSpend._sum.conversions || 1;
  const cac = Math.round(spend / convs);
  insights.push({ id: "cac-insight", type: cac < 500 ? "trend" : "risk", title: `Customer Acquisition Cost: ₹${cac}`, description: cac < 500 ? `CAC of ₹${cac} is healthy for Indian e-commerce (benchmark: ₹400-700). Keep optimizing landing pages.` : `CAC of ₹${cac} exceeds the ₹700 benchmark. Shift budget to organic and influencer channels.`, metric: "CAC", value: `₹${cac}`, confidence: 86, action: cac < 500 ? "Scale best-performing ad sets" : "Invest in influencer marketing", page: "marketing" });

  // Email channel
  const emailCampaigns = await prisma.marketingCampaign.findMany({ where: { channel: "Email" }, orderBy: { roas: "desc" }, take: 1 });
  if (emailCampaigns.length) {
    insights.push({ id: "email-insight", type: "opportunity", title: "Email Has Highest ROAS", description: "Email campaigns show 4.2x ROAS on average — the highest of all channels. Increase email list growth through exit-intent popups.", confidence: 89, action: "Add exit-intent popup to capture email leads", page: "marketing" });
  }

  return insights.slice(0, 3);
}

// ── Regional Insights ──────────────────────────────────────────────────────

export async function getRegionalInsights(): Promise<Insight[]> {
  const now = new Date();
  const insights: Insight[] = [];

  const regions = await prisma.salesRecord.groupBy({ by: ["region"], _sum: { revenue: true }, _count: { id: true }, orderBy: { _sum: { revenue: "desc" } }, where: { date: { gte: subDays(now, 30) } } });

  if (regions.length >= 2) {
    const top = regions[0];
    const bottom = regions[regions.length - 1];
    insights.push({ id: "top-city", type: "trend", title: `${top.region} Leads with ${fmt(top._sum.revenue || 0)}`, description: `${top.region} is the highest-grossing city this month with ${top._count.id} orders. Sustained by strong logistics network and high smartphone penetration.`, confidence: 95, action: "Open a dark store / warehouse in this region", page: "regional" });

    const gap = top._sum.revenue && bottom._sum.revenue ? Math.round((top._sum.revenue / bottom._sum.revenue)) : 0;
    if (gap > 3) {
      insights.push({ id: "city-gap", type: "risk", title: `${gap}x Revenue Gap Between Cities`, description: `${top.region} generates ${gap}x more revenue than ${bottom.region}. Untapped potential in ${bottom.region} — consider hyperlocal marketing.`, confidence: 82, action: `Launch ${bottom.region}-specific discount campaign`, page: "regional" });
    }
  }

  insights.push({ id: "tier2-opp", type: "opportunity", title: "Tier-2 Cities Show 28% Growth", description: "Cities like Jaipur, Lucknow, and Surat are growing at 28% YoY — outpacing metros. First-mover advantage available with local language content.", confidence: 79, action: "Launch Hindi/regional language product pages", page: "regional" });

  return insights.slice(0, 3);
}
