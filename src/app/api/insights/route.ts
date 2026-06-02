import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOverviewInsights, getRevenueInsights, getProductInsights,
  getSalesInsights, getMarketingInsights, getRegionalInsights,
} from "@/lib/insights";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "overview";

    let insights;
    switch (page) {
      case "revenue":   insights = await getRevenueInsights(); break;
      case "products":  insights = await getProductInsights(); break;
      case "sales":     insights = await getSalesInsights(); break;
      case "marketing": insights = await getMarketingInsights(); break;
      case "regional":  insights = await getRegionalInsights(); break;
      default:          insights = await getOverviewInsights(); break;
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[INSIGHTS_API]", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
