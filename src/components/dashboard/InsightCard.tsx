"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Lightbulb, ShieldAlert, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { Insight, InsightType } from "@/lib/insights";

const TYPE_CONFIG: Record<InsightType, { icon: React.ReactNode; label: string; colors: { badge: string; border: string; glow: string; dot: string } }> = {
  trend: {
    icon: <TrendingUp size={13} />,
    label: "Trend",
    colors: { badge: "rgba(13,148,136,0.1)", border: "rgba(13,148,136,0.25)", glow: "rgba(13,148,136,0.1)", dot: "#0d9488" },
  },
  opportunity: {
    icon: <Lightbulb size={13} />,
    label: "Opportunity",
    colors: { badge: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.08)", dot: "#10b981" },
  },
  anomaly: {
    icon: <Zap size={13} />,
    label: "Anomaly",
    colors: { badge: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.08)", dot: "#f59e0b" },
  },
  risk: {
    icon: <ShieldAlert size={13} />,
    label: "Risk",
    colors: { badge: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", glow: "rgba(239,68,68,0.08)", dot: "#ef4444" },
  },
};

function SingleInsight({ insight }: { insight: Insight }) {
  const cfg = TYPE_CONFIG[insight.type];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      {/* Dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.colors.dot, marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${cfg.colors.dot}` }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          {/* Heading */}
          <span style={{ fontSize: 13, fontWeight: 650, color: "var(--foreground)" }}>{insight.title}</span>
          
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
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>{insight.description}</p>
        
        {insight.action && (
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: "var(--muted)", border: "1px solid var(--border)", fontSize: 11, color: "var(--muted-foreground)" }}>
            <span style={{ color: cfg.colors.dot, fontWeight: 700 }}>→</span> {insight.action}
          </div>
        )}
        
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ height: 3.5, width: 48, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${insight.confidence}%`, background: cfg.colors.dot, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500 }}>{insight.confidence}% confidence</span>
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
      <div 
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: expanded ? "1px solid var(--border)" : "none", cursor: "pointer" }} 
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.25)" }}>
            <Sparkles size={14} color="#0d9488" className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 750, color: "var(--foreground)" }}>AI Insights</span>
              <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "rgba(13,148,136,0.15)", color: "#0d9488", border: "1px solid rgba(13,148,136,0.25)" }}>
                {insights.length} insights
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0, fontWeight: 500 }}>Rule-based pattern analysis · Updated just now</p>
          </div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Insights list */}
      {expanded && (
        <div style={{ padding: "4px 20px 12px" }}>
          {isLoading ? (
            <div style={{ padding: "16px 0" }} className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border)", marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }} className="space-y-2">
                    <div className="skeleton h-3.5 w-3/5 rounded" />
                    <div className="skeleton h-3 w-11/12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted-foreground)", fontSize: 13, fontWeight: 500 }}>
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
