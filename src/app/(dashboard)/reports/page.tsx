"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Clock, Calendar, Eye, MoreHorizontal, Trash2, Download, CheckCircle2, AlertCircle, Edit } from "lucide-react";
import { formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { REPORT_TYPES } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  DRAFT: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  ARCHIVED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const TYPE_COLORS: Record<string, string> = {
  revenue: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  sales: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  users: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  products: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  regional: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  marketing: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  custom: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "revenue" });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const q = typeFilter !== "all" ? `?type=${typeFilter}` : "";
      const res = await fetch(`/api/reports${q}`);
      const data = await res.json();
      setReports(data.items || []);
    } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Report name is required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, config: {} }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Report created", { description: `"${form.name}" has been saved.` });
      setShowCreate(false);
      setForm({ name: "", description: "", type: "revenue" });
      fetchReports();
    } finally { setCreating(false); }
  };

  const handleDownloadCSV = (report: any) => {
    // Generate mock CSV rows based on the report type
    let mockDataRows = "";
    if (report.type === "revenue") {
      mockDataRows = [
        "Month,Channel,Revenue (INR),Margin %",
        "Jun 2025,Partner API,44000000,55.0",
        "Jun 2025,App - iOS,46000000,58.2",
        "Jun 2025,App - Android,45000000,56.5",
        "Jun 2025,WhatsApp Commerce,45000000,54.0",
        "Jun 2025,Website,47000000,52.3"
      ].join("\n");
    } else if (report.type === "sales") {
      mockDataRows = [
        "Date,Product,SKU,Region,Revenue (INR),Units Sold",
        "2025-06-01,Redmi Note 13 Pro 5G,REDMI-13P,North,19000000,950",
        "2025-06-01,OnePlus Nord CE 3,ONEPLUS-N3,West,12000000,600",
        "2025-06-02,Samsung Galaxy Tab S9,SAMSUNG-S9,South,15000000,300",
        "2025-06-02,Nike Air Max 270,NIKE-270,East,8000000,800"
      ].join("\n");
    } else if (report.type === "products") {
      mockDataRows = [
        "Product,SKU,Category,Avg Gross Margin,Inventory Status",
        "Redmi Note 13 Pro 5G,REDMI-13P,Electronics,30.0%,In Stock",
        "OnePlus Nord CE 3,ONEPLUS-N3,Electronics,25.5%,Low Stock",
        "Samsung Galaxy Tab S9,SAMSUNG-S9,Electronics,28.0%,In Stock",
        "Nike Air Max 270,NIKE-270,Fashion & Apparel,62.0%,In Stock"
      ].join("\n");
    } else {
      mockDataRows = [
        "Region,Sales Volume,Revenue Share %,Active Users",
        "North metro,15400,35.4%,8500",
        "South metro,12200,28.0%,6200",
        "West metro,9800,22.5%,4900",
        "East metro,6100,14.1%,3200"
      ].join("\n");
    }

    const csvContent = [
      "Report Property,Value",
      `Report ID,${report.id}`,
      `Report Name,"${report.name.replace(/"/g, '""')}"`,
      `Description,"${(report.description || "").replace(/"/g, '""')}"`,
      `Type,${report.type}`,
      `Status,${report.status}`,
      `Views,${report.viewCount}`,
      `Scheduled,${report.isScheduled}`,
      `Frequency,${report.scheduleFreq || "N/A"}`,
      `Created By,${report.createdBy?.name || "System"}`,
      `Last Updated,${report.updatedAt}`,
      "",
      "-- Report Dataset Preview --",
      mockDataRows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedFilename = report.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_report.csv";
    link.download = sanitizedFilename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully", { description: sanitizedFilename });
  };

  const handleDownloadPDF = (report: any) => {
    const doc = new jsPDF();
    
    // Add border accent
    doc.setDrawColor(13, 148, 136); // Teal color
    doc.setLineWidth(1.5);
    doc.line(10, 10, 200, 10);
    
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("ZipKart Marketplace Analytics", 10, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Auto-Generated Enterprise Business Report", 10, 28);
    
    // Date
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    doc.text(`Generated on: ${today}`, 130, 28);
    
    // Separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(10, 32, 200, 32);
    
    // Report Title Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(report.name, 10, 42);
    
    // Report Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    const splitDesc = doc.splitTextToSize(report.description || "No description provided.", 180);
    doc.text(splitDesc, 10, 48);
    
    // Metadata Block
    const metaY = 48 + (splitDesc.length * 5) + 5;
    
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setFillColor(250, 250, 250); // slate-50
    doc.rect(10, metaY, 190, 35, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("REPORT PROPERTIES", 14, metaY + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    
    doc.text(`Report ID: ${report.id}`, 14, metaY + 14);
    doc.text(`Type: ${report.type.toUpperCase()}`, 14, metaY + 20);
    doc.text(`Status: ${report.status}`, 14, metaY + 26);
    
    doc.text(`Created By: ${report.createdBy?.name || "System"}`, 100, metaY + 14);
    doc.text(`Frequency: ${report.scheduleFreq || "Manual"}`, 100, metaY + 20);
    doc.text(`View Count: ${report.viewCount}`, 100, metaY + 26);
    
    // Mock Data Section
    const dataY = metaY + 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("REPORT DATASETS", 10, dataY);
    
    // Draw simple table headers
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (report.type === "revenue") {
      headers = ["Month", "Channel", "Revenue (INR)", "Margin %"];
      rows = [
        ["Jun 2025", "Partner API", "Rs. 4.40 Cr", "55.0%"],
        ["Jun 2025", "App - iOS", "Rs. 4.60 Cr", "58.2%"],
        ["Jun 2025", "App - Android", "Rs. 4.50 Cr", "56.5%"],
        ["Jun 2025", "WhatsApp Commerce", "Rs. 4.50 Cr", "54.0%"],
        ["Jun 2025", "Website", "Rs. 4.70 Cr", "52.3%"]
      ];
    } else if (report.type === "sales") {
      headers = ["Date", "Product", "Region", "Revenue", "Units"];
      rows = [
        ["2025-06-01", "Redmi Note 13 Pro 5G", "North", "Rs. 1.90 Cr", "950"],
        ["2025-06-01", "OnePlus Nord CE 3", "West", "Rs. 1.20 Cr", "600"],
        ["2025-06-02", "Samsung Galaxy Tab S9", "South", "Rs. 1.50 Cr", "300"],
        ["2025-06-02", "Nike Air Max 270", "East", "Rs. 80 Lakh", "800"]
      ];
    } else if (report.type === "products") {
      headers = ["Product", "Category", "Avg Margin", "Status"];
      rows = [
        ["Redmi Note 13 Pro 5G", "Electronics", "30.0%", "In Stock"],
        ["OnePlus Nord CE 3", "Electronics", "25.5%", "Low Stock"],
        ["Samsung Galaxy Tab S9", "Electronics", "28.0%", "In Stock"],
        ["Nike Air Max 270", "Fashion", "62.0%", "In Stock"]
      ];
    } else {
      headers = ["Region", "Sales Vol", "Rev Share", "Active Users"];
      rows = [
        ["North metro", "15,400", "35.4%", "8,500"],
        ["South metro", "12,200", "28.0%", "6,200"],
        ["West metro", "9,800", "22.5%", "4,900"],
        ["East metro", "6,100", "14.1%", "3,200"]
      ];
    }
    
    // Draw table
    let currentY = dataY + 8;
    
    // Header background
    doc.setFillColor(13, 148, 136); // Teal header
    doc.rect(10, currentY, 190, 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    
    const colWidth = 190 / headers.length;
    headers.forEach((h, i) => {
      doc.text(h, 12 + (i * colWidth), currentY + 5.5);
    });
    
    currentY += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    
    rows.forEach((row, rowIndex) => {
      // Alternating background colors
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(10, currentY, 190, 7.5, "F");
      }
      
      row.forEach((cell, cellIndex) => {
        doc.text(cell, 12 + (cellIndex * colWidth), currentY + 5);
      });
      currentY += 7.5;
    });
    
    // Footer
    const footerY = 280;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(10, footerY - 5, 200, footerY - 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("ZipKart Ltd · Confidential Business Analytics Report", 10, footerY);
    doc.text("Page 1 of 1", 185, footerY);
    
    // Save PDF
    const sanitizedFilename = report.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_report.pdf";
    doc.save(sanitizedFilename);
    toast.success("PDF Report generated successfully", { description: sanitizedFilename });
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, schedule, and manage analytics reports.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg gradient-brand text-white px-4 py-2 text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Report
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in">
            <h2 className="text-base font-semibold">Create New Report</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Report Name *</label>
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Q3 Revenue Summary"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional description..."
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Report Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="rounded-lg gradient-brand text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
                {creating ? "Creating..." : "Create Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", ...REPORT_TYPES.map(t => t.value)].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              typeFilter === t ? "bg-primary text-primary-foreground shadow-sm" : "border border-border text-muted-foreground hover:bg-muted")}>
            {t === "all" ? "All Reports" : REPORT_TYPES.find(r => r.value === t)?.label || t}
          </button>
        ))}
      </div>

      {/* Reports grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-8 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-border/80 transition-all space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium capitalize", TYPE_COLORS[report.type] || "bg-muted")}>
                    {report.type}
                  </span>
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", STATUS_STYLES[report.status])}>
                    {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownloadCSV(report)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDownloadPDF(report)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download PDF"
                  >
                    <FileText className="h-3.5 w-3.5 text-violet-500" />
                  </button>
                  <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm leading-snug">{report.name}</h3>
                {report.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />{report.viewCount} views
                </span>
                {report.isScheduled && (
                  <span className="flex items-center gap-1 text-primary">
                    <Calendar className="h-3 w-3" />{report.scheduleFreq}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  <span>by </span>
                  <span className="font-medium text-foreground">{report.createdBy?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(report.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No reports found</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first report to get started.</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 rounded-lg gradient-brand text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 transition-all">
            Create Report
          </button>
        </div>
      )}
    </div>
  );
}
