"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ShieldAlert, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { Insight, InsightType } from "@/lib/insights";

const TYPE_CONFIG: Record<InsightType, { icon: React.ReactNode; label: string; colors: { badge: string; border: string; glow: string; dot: string } }> = {
  trend: {
    icon: <TrendingUp size={13} />,
    label: "Trend",
    colors: { badge: "rgba(13,148,136,0.15)", border: "rgba(13,148,136,0.4)", glow: "rgba(13,148,136,0.15)", dot: "#0d9488" },
  },
  opportunity: {
    icon: <Lightbulb size={13} />,
    label: "Opportunity",
    colors: { badge: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", glow: "rgba(16,185,129,0.1)", dot: "#10b981" },
  },
  anomaly: {
    icon: <Zap size={13} />,
    label: "Anomaly",
    colors: { badge: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", glow: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  },
  risk: {
    icon: <ShieldAlert size={13} />,
    label: "Risk",
    colors: { badge: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", glow: "rgba(239,68,68,0.1)", dot: "#ef4444" },
  },
};

function SingleInsight({ insight }: { insight: Insight }) {
  const cfg = TYPE_CONFIG[insight.type];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.colors.dot, marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${cfg.colors.dot}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{insight.title}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: cfg.colors.badge, color: cfg.colors.dot, border: `1px solid ${cfg.colors.border}` }}>
            {cfg.icon} {cfg.label}
          </span>
          {insight.value && (
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.colors.dot }}>{insight.value}</span>
          )}
          {insight.change !== undefined && (
            <span style={{ fontSize: 11, color: insight.change >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
              {insight.change >= 0 ? "↑" : "↓"} {Math.abs(insight.change)}%
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{insight.description}</p>
        {insight.action && (
          <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "#64748b" }}>
            <span style={{ color: cfg.colors.dot }}>→</span> {insight.action}
          </div>
        )}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ height: 3, width: 48, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${insight.confidence}%`, background: cfg.colors.dot, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: "#475569" }}>{insight.confidence}% confidence</span>
        </div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  insights: Insight[];
  page: string;
  isLoading?: boolean;
}

export function InsightCard({ insights, page, isLoading }: InsightCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(14,165,233,0.04) 100%)",
      border: "1px solid rgba(13,148,136,0.25)",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)" }}>
            <Sparkles size={14} color="#2dd4bf" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>AI Insights</span>
              <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "rgba(13,148,136,0.2)", color: "#2dd4bf", border: "1px solid rgba(13,148,136,0.3)" }}>
                {insights.length} insights
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>Rule-based pattern analysis · Updated just now</p>
          </div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Insights list */}
      {expanded && (
        <div style={{ padding: "4px 20px 8px" }}>
          {isLoading ? (
            <div style={{ padding: "20px 0" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.1)", marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: "60%", borderRadius: 4, background: "rgba(255,255,255,0.08)", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
                    <div style={{ height: 10, width: "90%", borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#475569", fontSize: 13 }}>
              No insights available yet — add more data to unlock AI analysis.
            </div>
          ) : (
            insights.map(ins => <SingleInsight key={ins.id} insight={ins} />)
          )}
        </div>
      )}
    </div>
  );
}
