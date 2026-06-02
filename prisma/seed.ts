import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { subDays, format } from "date-fns";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ── Master Data ──────────────────────────────────────────────────────────────

const CITIES = ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"];

const CHANNELS = ["App - Android", "App - iOS", "Website", "Partner API", "WhatsApp Commerce"];

const CATEGORIES: Record<string, { products: { name: string; basePrice: number; baseCogs: number }[] }> = {
  "Electronics": {
    products: [
      { name: "Redmi Note 13 Pro 5G", basePrice: 24999, baseCogs: 18000 },
      { name: "boAt Airdopes 141", basePrice: 1299, baseCogs: 600 },
      { name: "Samsung Galaxy Tab A9", basePrice: 18999, baseCogs: 13500 },
      { name: "OnePlus Nord CE 3 Lite", basePrice: 19999, baseCogs: 14200 },
      { name: "Boat Rockerz 450 Headphones", basePrice: 1499, baseCogs: 700 },
    ],
  },
  "Fashion & Apparel": {
    products: [
      { name: "Fabindia Cotton Kurta", basePrice: 1299, baseCogs: 450 },
      { name: "Levi's 511 Slim Jeans", basePrice: 2999, baseCogs: 900 },
      { name: "Nike Air Max 270", basePrice: 10995, baseCogs: 5500 },
      { name: "Biba Anarkali Suit", basePrice: 1899, baseCogs: 650 },
      { name: "Peter England Oxford Shirt", basePrice: 999, baseCogs: 380 },
    ],
  },
  "Home & Kitchen": {
    products: [
      { name: "Prestige Deluxe Pressure Cooker 5L", basePrice: 1899, baseCogs: 900 },
      { name: "Philips Air Fryer HD9200", basePrice: 5499, baseCogs: 2800 },
      { name: "Milton Thermosteel Flask 500ml", basePrice: 699, baseCogs: 280 },
      { name: "Godrej Aer Room Freshener Pack", basePrice: 349, baseCogs: 120 },
      { name: "Pigeon Non-Stick Cookware Set", basePrice: 1299, baseCogs: 550 },
    ],
  },
  "FMCG & Grocery": {
    products: [
      { name: "Tata Salt 1kg Pack", basePrice: 24, baseCogs: 14 },
      { name: "Amul Butter 500g", basePrice: 275, baseCogs: 200 },
      { name: "Haldiram's Bhujia 1kg", basePrice: 299, baseCogs: 140 },
      { name: "Dabur Honey 1kg", basePrice: 399, baseCogs: 200 },
      { name: "Maggi Noodles 12-Pack", basePrice: 180, baseCogs: 100 },
    ],
  },
  "Beauty & Personal Care": {
    products: [
      { name: "Lakme 9-to-5 Foundation", basePrice: 425, baseCogs: 160 },
      { name: "Mamaearth Vitamin C Serum", basePrice: 599, baseCogs: 200 },
      { name: "L'Oreal Paris Shampoo 650ml", basePrice: 349, baseCogs: 140 },
      { name: "Himalaya Face Wash 150ml", basePrice: 99, baseCogs: 35 },
      { name: "Nivea Body Lotion 400ml", basePrice: 245, baseCogs: 100 },
    ],
  },
  "Books & Stationery": {
    products: [
      { name: "Atomic Habits - James Clear", basePrice: 399, baseCogs: 150 },
      { name: "Class 10 NCERT Science Bundle", basePrice: 299, baseCogs: 90 },
      { name: "Camlin Geometry Box", basePrice: 149, baseCogs: 55 },
      { name: "Reynolds Pen 20-Pack", basePrice: 199, baseCogs: 70 },
      { name: "The Psychology of Money", basePrice: 349, baseCogs: 120 },
    ],
  },
};

const CAMPAIGNS = [
  { name: "Big Billion Days Sale", channel: "Multi-Channel", budget: 85_00_000, startDate: subDays(new Date(), 180), endDate: subDays(new Date(), 174), targetAudience: "All India", status: "completed" as const },
  { name: "Diwali Mega Sale 2024", channel: "App Notification", budget: 65_00_000, startDate: subDays(new Date(), 90), endDate: subDays(new Date(), 80), targetAudience: "Existing customers", status: "completed" as const },
  { name: "Republic Day Special", channel: "Paid Search", budget: 30_00_000, startDate: subDays(new Date(), 60), endDate: subDays(new Date(), 57), targetAudience: "Metro cities", status: "completed" as const },
  { name: "End of Season Sale - Fashion", channel: "Social Media", budget: 20_00_000, startDate: subDays(new Date(), 45), endDate: subDays(new Date(), 38), targetAudience: "18-35 age group", status: "completed" as const },
  { name: "Back to School 2025", channel: "Email", budget: 12_00_000, startDate: subDays(new Date(), 30), endDate: subDays(new Date(), 20), targetAudience: "Parents 28-45", status: "completed" as const },
  { name: "IPL Fan Fest Electronics", channel: "Video Ads", budget: 45_00_000, startDate: subDays(new Date(), 15), endDate: subDays(new Date(), 8), targetAudience: "Cricket fans 20-40", status: "completed" as const },
  { name: "Independence Day Sale", channel: "Paid Search", budget: 18_00_000, startDate: subDays(new Date(), 7), endDate: subDays(new Date(), 4), targetAudience: "All India", status: "active" as const },
  { name: "Holi Festival Beauty Sale", channel: "Influencer", budget: 8_00_000, startDate: subDays(new Date(), 3), endDate: new Date(), targetAudience: "Women 20-40", status: "active" as const },
  { name: "Grocery Super Savers Weekly", channel: "Email", budget: 5_00_000, startDate: new Date(), endDate: subDays(new Date(), -7), targetAudience: "Mumbai & Delhi NCR", status: "active" as const },
  { name: "Holi Flash Sale", channel: "Push Notification", budget: 6_50_000, startDate: subDays(new Date(), -2), endDate: subDays(new Date(), -5), targetAudience: "Tier-2 cities", status: "draft" as const },
  { name: "Mother's Day Gift Guide", channel: "Social Media", budget: 10_00_000, startDate: subDays(new Date(), -5), endDate: subDays(new Date(), -12), targetAudience: "Gifters 22-45", status: "draft" as const },
  { name: "Monsoon Apparel Refresh", channel: "Display Ads", budget: 14_00_000, startDate: subDays(new Date(), -10), endDate: subDays(new Date(), -20), targetAudience: "Fashion buyers", status: "draft" as const },
];

const SALES_REPS = ["Arjun Mehta", "Priya Iyer", "Rahul Sharma", "Sneha Nair", "Vikram Reddy", "Anjali Singh", "Karan Patel", "Meera Krishnan"];

const TRAFFIC_SOURCES = ["Organic Search", "Google Ads", "Meta Ads", "Direct", "Email Newsletter", "YouTube Ads", "Influencer", "Referral"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function seasonalMultiplier(date: Date): number {
  const month = date.getMonth();
  const day = date.getDate();
  // Diwali season (Oct-Nov), Big Billion Days (Oct), New Year, Republic Day
  if (month === 9) return 1.8 + Math.random() * 0.4;  // October - Big Billion Days
  if (month === 10) return 2.1 + Math.random() * 0.5; // November - Diwali
  if (month === 11) return 1.5 + Math.random() * 0.3; // December - Year end
  if (month === 0 && day <= 26) return 1.3;            // January Republic Day
  if (month === 7) return 1.2;                         // August Independence Day
  if (month === 2 || month === 3) return 1.1;          // March-April Holi + summer
  return 1.0 + Math.random() * 0.15;
}

async function main() {
  console.log("🗑️  Clearing existing data...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.report.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.salesRecord.deleteMany();
  await prisma.analyticsRecord.deleteMany();
  await prisma.dashboardLayout.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log("✅ Cleared.");

  // ── Organization ────────────────────────────────────────────────────────────
  console.log("🏢 Creating ZipKart organization...");
  const org = await prisma.organization.create({
    data: {
      name: "ZipKart Marketplace Pvt Ltd",
      slug: "zipkart",
      plan: "Enterprise",
      industry: "E-commerce Marketplace",
      size: "2400",
    },
  });

  // ── Users ────────────────────────────────────────────────────────────────────
  console.log("👥 Creating users...");
  const adminHash = await bcrypt.hash("Admin@123!", 12);
  const analystHash = await bcrypt.hash("Analyst@123!", 12);
  const viewerHash = await bcrypt.hash("Viewer@123!", 12);

  const admin = await prisma.user.create({
    data: { 
      name: "Ziya Khan", 
      email: "admin@zipkart.io", 
      passwordHash: adminHash, 
      role: "ADMIN", 
      jobTitle: "VP of Analytics", 
      department: "Data & Insights", 
      organizationId: org.id, 
      isActive: true, 
      emailVerified: new Date() 
    },
  });

  const users = await Promise.all([
    prisma.user.create({ data: { name: "Arjun Mehta", email: "analyst@zipkart.io", passwordHash: analystHash, role: "ANALYST", jobTitle: "Senior Data Analyst", department: "Analytics", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Priya Iyer", email: "priya@zipkart.io", passwordHash: analystHash, role: "ANALYST", jobTitle: "Growth Analyst", department: "Growth", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Rahul Sharma", email: "rahul@zipkart.io", passwordHash: viewerHash, role: "VIEWER", jobTitle: "Marketing Manager", department: "Marketing", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Sneha Nair", email: "sneha@zipkart.io", passwordHash: viewerHash, role: "VIEWER", jobTitle: "Category Manager", department: "Merchandising", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Vikram Reddy", email: "vikram@zipkart.io", passwordHash: analystHash, role: "ANALYST", jobTitle: "BI Developer", department: "Data Engineering", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Anjali Singh", email: "anjali@zipkart.io", passwordHash: viewerHash, role: "VIEWER", jobTitle: "Seller Success Manager", department: "Seller Relations", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { name: "Karan Patel", email: "viewer@zipkart.io", passwordHash: viewerHash, role: "VIEWER", jobTitle: "Operations Analyst", department: "Operations", organizationId: org.id, isActive: true, emailVerified: new Date() } }),
  ]);
  console.log(`✅ Created ${users.length + 1} users`);

  // ── Analytics Records (2 years daily) ───────────────────────────────────────
  console.log("📊 Seeding 2 years of analytics records...");
  const analyticsData: any[] = [];
  const today = new Date();

  for (let d = 730; d >= 0; d--) {
    const date = subDays(today, d);
    const sm = seasonalMultiplier(date);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const wm = isWeekend ? 1.25 : 1.0;

    const baseRevenue = 28_00_000 * sm * wm * (1 + (730 - d) / 3000);
    const revenue = baseRevenue * randFloat(0.92, 1.08);
    const activeUsers = rand(18000, 35000) * sm * wm;
    const sessions = activeUsers * randFloat(1.8, 2.5);
    const conversions = sessions * randFloat(0.018, 0.032) * sm;
    const bounceRate = randFloat(38, 62) / (sm * 0.8);

    // Overall metrics
    analyticsData.push(
      { metric: "revenue", value: Math.round(revenue), date, category: "overall", source: null, dimension: null },
      { metric: "active_users", value: Math.round(activeUsers), date, category: "overall", source: null, dimension: null },
      { metric: "sessions", value: Math.round(sessions), date, category: "overall", source: null, dimension: null },
      { metric: "conversions", value: Math.round(conversions), date, category: "overall", source: null, dimension: null },
      { metric: "bounce_rate", value: Math.min(80, Math.round(bounceRate * 10) / 10), date, category: "overall", source: null, dimension: null },
    );

    // Channel traffic breakdown
    const totalSessions = Math.round(sessions);
    const channelWeights = [0.28, 0.22, 0.18, 0.12, 0.09, 0.07, 0.03, 0.01];
    TRAFFIC_SOURCES.forEach((src, i) => {
      analyticsData.push({
        metric: "sessions", value: Math.round(totalSessions * channelWeights[i] * randFloat(0.9, 1.1)),
        date, category: "channel", source: src, dimension: null,
      });
    });
  }

  // Batch insert analytics
  for (let i = 0; i < analyticsData.length; i += 500) {
    await prisma.analyticsRecord.createMany({ data: analyticsData.slice(i, i + 500), skipDuplicates: true });
  }
  console.log(`✅ Inserted ${analyticsData.length} analytics records`);

  // ── Sales Records ─────────────────────────────────────────────────────────────
  console.log("💰 Seeding sales records...");
  const salesData: any[] = [];
  const allProducts = Object.entries(CATEGORIES).flatMap(([cat, { products }]) => products.map(p => ({ ...p, category: cat })));

  for (let d = 730; d >= 0; d--) {
    const date = subDays(today, d);
    const sm = seasonalMultiplier(date);
    const isWeekend = [0, 6].includes(date.getDay());
    const ordersPerDay = Math.round(rand(180, 320) * sm * (isWeekend ? 1.3 : 1.0));

    for (let o = 0; o < ordersPerDay; o++) {
      const product = pick(allProducts);
      const city = pick(CITIES);
      const channel = pick(CHANNELS);
      const rep = pick(SALES_REPS);
      const units = rand(1, 4);
      const priceVariation = randFloat(0.9, 1.1);
      const revenue = Math.round(product.basePrice * units * priceVariation * sm);
      const cogs = Math.round(product.baseCogs * units);
      const discount = Math.random() < 0.35 ? Math.round(revenue * randFloat(0.05, 0.2)) : 0;
      
      const sku = `SKU-${product.name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}-${rand(100, 999)}`;
      const margin = (revenue - discount) - cogs;

      salesData.push({
        date, 
        revenue: revenue - discount, 
        cogs, 
        units, 
        sku,
        margin,
        country: "India",
        product: product.name, 
        category: product.category,
        region: city, 
        channel, 
        salesRep: rep,
      });
    }
  }

  for (let i = 0; i < salesData.length; i += 500) {
    await prisma.salesRecord.createMany({ data: salesData.slice(i, i + 500) });
  }
  console.log(`✅ Inserted ${salesData.length} sales records`);

  // ── Marketing Campaigns ───────────────────────────────────────────────────────
  console.log("📣 Creating campaigns...");
  for (const c of CAMPAIGNS) {
    const impressions = rand(8_00_000, 45_00_000);
    const clicks = Math.round(impressions * randFloat(0.025, 0.06));
    const conversions = Math.round(clicks * randFloat(0.03, 0.09));
    const spend = Math.round(c.budget * randFloat(0.75, 0.98));
    const revenue = Math.round(spend * randFloat(1.6, 4.8));
    
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    await prisma.marketingCampaign.create({
      data: {
        name: c.name, 
        channel: c.channel, 
        status: c.status,
        budget: c.budget, 
        spend, 
        revenue, 
        impressions, 
        clicks, 
        conversions, 
        ctr,
        cpc,
        roas,
        startDate: c.startDate, 
        endDate: c.endDate,
        region: "India",
      },
    });
  }
  console.log(`✅ Created ${CAMPAIGNS.length} campaigns`);

  // ── Reports ───────────────────────────────────────────────────────────────────
  console.log("📄 Creating reports...");
  const reportTemplates = [
    { name: "Monthly GMV Report - April 2025", type: "revenue", status: "PUBLISHED" as const },
    { name: "Big Billion Days 2024 - Post Campaign Analysis", type: "marketing", status: "PUBLISHED" as const },
    { name: "Electronics Category Deep Dive Q1 2025", type: "products", status: "PUBLISHED" as const },
    { name: "Bengaluru vs Mumbai Market Comparison", type: "regional", status: "PUBLISHED" as const },
    { name: "Seller Performance Scorecard - Q4 2024", type: "sales", status: "PUBLISHED" as const },
    { name: "App vs Web Conversion Funnel Analysis", type: "users", status: "DRAFT" as const },
    { name: "Monsoon Season Demand Forecast 2025", type: "revenue", status: "DRAFT" as const },
  ];

  for (const r of reportTemplates) {
    await prisma.report.create({
      data: {
        name: r.name, 
        type: r.type, 
        status: r.status,
        description: `Auto-generated ${r.type} report for ZipKart marketplace analytics.`,
        createdById: pick([admin, ...users]).id,
        organizationId: org.id,
        isScheduled: Math.random() > 0.6,
        scheduleFreq: pick(["weekly", "monthly"]) || undefined,
        config: { chartType: "line", metrics: ["value"], dimensions: ["date"] },
      },
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");
  const notifs = [
    { title: "Big Billion Days Revenue Target Hit! 🎯", body: "GMV crossed ₹2.1 Crore in 24 hours — highest single-day GMV ever recorded.", type: "SUCCESS" as const },
    { title: "Payment Gateway Degraded", body: "Razorpay success rate dropped to 91% (SLA: 98%). Escalation sent to engineering.", type: "ERROR" as const },
    { title: "Electronics Category Growing Fast", body: "Electronics GMV up 34% MoM. Smartphones & TWS earbuds leading the charge.", type: "INFO" as const },
    { title: "Diwali Campaign Budget 80% Utilized", body: "₹52L of ₹65L Diwali campaign budget spent. 6 days remaining.", type: "WARNING" as const },
    { title: "New Seller Onboarded: TechZone India", body: "TechZone India (250+ SKUs) is now live on the marketplace.", type: "SUCCESS" as const },
    { title: "Inventory Alert: boAt Airdopes 141", body: "Stock running low in Bengaluru & Chennai warehouses. 3-day reorder lead time.", type: "WARNING" as const },
    { title: "Weekly Report Ready", body: "Your scheduled GMV & Category Performance report for the week is ready to view.", type: "INFO" as const },
  ];

  for (const n of notifs) {
    await prisma.notification.create({
      data: { 
        title: n.title, 
        body: n.body, 
        type: n.type, 
        userId: admin.id, 
        read: Math.random() > 0.5 
      },
    });
  }

  // ── Activity Logs ─────────────────────────────────────────────────────────────
  console.log("🕵️  Creating activity logs...");
  const activities = [
    { action: "EXPORT", entity: "Report", entityName: "Monthly GMV Report - April 2025" },
    { action: "CREATE", entity: "Campaign", entityName: "Independence Day Sale" },
    { action: "LOGIN", entity: "Auth", entityName: "Ziya Khan" },
    { action: "VIEW", entity: "Dashboard", entityName: "Overview" },
    { action: "UPDATE", entity: "Campaign", entityName: "Diwali Mega Sale 2024" },
    { action: "CREATE", entity: "Report", entityName: "App vs Web Funnel Analysis" },
    { action: "EXPORT", entity: "Dataset", entityName: "Electronics Sales Q1 2025" },
    { action: "VIEW", entity: "Page", entityName: "Regional Analytics" },
  ];

  for (const a of activities) {
    await prisma.activityLog.create({
      data: { 
        action: a.action as any, 
        entity: a.entity, 
        entityName: a.entityName, 
        userId: pick([admin, ...users]).id, 
        ip: `103.${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}` 
      },
    });
  }

  console.log("\n🎉 ZipKart Analytics seed completed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🔐 Admin Login:");
  console.log("     Email:    admin@zipkart.io");
  console.log("     Password: Admin@123!");
  console.log("  🔐 Analyst Login:");
  console.log("     Email:    analyst@zipkart.io");
  console.log("     Password: Analyst@123!");
  console.log("  🔐 Viewer Login:");
  console.log("     Email:    viewer@zipkart.io");
  console.log("     Password: Viewer@123!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  📦 ${salesData.length.toLocaleString()} sales records`);
  console.log(`  📊 ${analyticsData.length.toLocaleString()} analytics records`);
  console.log(`  📣 ${CAMPAIGNS.length} marketing campaigns`);
  console.log(`  👥 8 team members`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
