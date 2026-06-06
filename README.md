# 🛒 ZipKart Analytics

An enterprise-grade, high-performance Business Intelligence (BI) and analytics SaaS platform built for modern e-commerce marketplaces. ZipKart transforms raw e-commerce sales, user, and campaign data into beautiful, actionable insights through high-fidelity charts, automated reports, and user-friendly data import pipelines.

---

## 🚀 Key Features

*   **📊 Dynamic BI Dashboards**: Interactive metrics tracking key performance indicators (KPIs) like Gross Merchandise Value (GMV), customer acquisition cost, retention rates, and operating margins.
*   **🧩 Rich Analytical Modules**:
    *   **Sales**: Top-selling products, category distribution, and sales rep performance.
    *   **Revenue**: MRR/ARR trajectories, cohort analysis, and revenue streams.
    *   **Users**: Daily Active Users (DAU), Monthly Active Users (MAU), session logs, and channel attribution.
    *   **Products**: Symmetrical category performance charts with margin and COGS tracking.
    *   **Regional**: Interactive geography breakdowns covering sales hotspots.
    *   **Marketing**: Marketing campaigns analyzer monitoring ROAS, impressions, CTR, and CPC.
*   **📥 CSV Import Engine**: Drag-and-drop file upload engine with client-side CSV parsing, data preview, and column schema mapping.
*   **📅 Automated Reports**: Schedule reports (daily, weekly, monthly) and manage drafts or published reporting configs.
*   **🛡️ Admin Control Panel**: Role-Based Access Control (RBAC) user list, API key generator, settings management, and a complete paginated system audit log.
*   **✨ Premium Visual Theme**:
    *   Sleek horizontal navigation header with solid, opaque dropdown menus.
    *   Modern off-white responsive light theme combined with an obsidian dark theme.
    *   Interactive login screen featuring an elegant, orbiting particle canvas background.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
*   **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres database)
*   **ORM**: [Prisma v7](https://www.prisma.io/) (with `@prisma/adapter-pg` & SSL config)
*   **Authentication**: [Auth.js v5](https://authjs.dev/) (NextAuth with JWT stateless sessions & RBAC)
*   **Charts**: [Recharts 3](https://recharts.org/) (Custom tooltip, axis tick rotations, and collision prevention)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
*   **Utilities**: [Zod](https://zod.dev/) (validation) & [Date-fns v4](https://date-fns.org/) (date arithmetic)

---

## ⚡ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and a running Neon PostgreSQL instance.

### 2. Clone and Setup Environment
Clone the repository and create a `.env` file in the root directory:

```bash
git clone https://github.com/ZIYA8909/ZipKart.git
cd ZipKart
```

Configure your `.env` environment variables:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-your-pooler-id.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-byte-base64-secret-key"
```

*Note: In production environments, remove `AUTH_URL` and `NEXTAUTH_URL` variables to allow Auth.js to auto-infer your Vercel deployment URL.*

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Deploy database migrations to create the tables, then seed the database with 2 years of e-commerce data (generating over 260K records):

```bash
# Apply migrations
npm run db:migrate

# Seed data
npm run db:seed
```

#### Seed Credentials
Once seeded, the database contains three demo accounts representing different RBAC roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@zipkart.io` | `Admin@123!` |
| **Analyst** | `analyst@zipkart.io` | `Analyst@123!` |
| **Viewer** | `viewer@zipkart.io` | `Viewer@123!` |

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser to explore the dashboard.

---

## 🚢 Production Deployment

This project is configured to deploy seamlessly to [Vercel](https://vercel.com).

1. Import your repository into Vercel.
2. In Vercel Project Settings, add your environment variables (`DATABASE_URL`, `AUTH_SECRET`).
3. Set the build command to automatically generate the Prisma client:
   ```bash
   prisma generate && next build
   ```
4. Verify deployment and log in with your seeded administrator credentials!
