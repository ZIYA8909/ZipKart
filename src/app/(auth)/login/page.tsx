"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

// ── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 100;
    const MAX_DIST = 120;
    const mouse = { x: W / 2, y: H / 2 };

    interface Particle {
      centerX: number;
      centerY: number;
      baseRadius: number;
      angle: number;
      angularSpeed: number;
      r: number;
      opacity: number;
      phase: number;
      offsetX: number;
      offsetY: number;
      x: number;
      y: number;
    }

    const particles: Particle[] = [];
    const orbitRadii = [60, 120, 180, 240, 300, 360, 420];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const orbitIndex = i % orbitRadii.length;
      const baseR = orbitRadii[orbitIndex] + (Math.random() - 0.5) * 25;
      particles.push({
        centerX: W / 2,
        centerY: H / 2,
        baseRadius: baseR,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (0.0003 + Math.random() * 0.0005) * (orbitIndex % 2 === 0 ? 1 : -1),
        r: Math.random() * 2 + 1.2,
        opacity: Math.random() * 0.35 + 0.15,
        phase: Math.random() * Math.PI * 2,
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0,
      });
    }

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      time += 0.002;

      // Dynamic center shifting (organic breathing motion)
      const cx = W / 2 + Math.sin(time) * 30;
      const cy = H / 2 + Math.cos(time * 0.8) * 20;

      for (const p of particles) {
        p.angle += p.angularSpeed;
        const currentRadius = p.baseRadius + Math.sin(time * 1.5 + p.phase) * 10;
        
        // Calculate orbit coordinate
        const targetX = cx + Math.cos(p.angle) * currentRadius;
        const targetY = cy + Math.sin(p.angle) * currentRadius;

        // Gentle mouse repulsion
        const dx = targetX - mouse.x;
        const dy = targetY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 140) {
          const force = (140 - dist) / 140;
          p.offsetX += (dx / dist) * force * 1.2;
          p.offsetY += (dy / dist) * force * 1.2;
        }

        p.offsetX *= 0.95;
        p.offsetY *= 0.95;

        const px = targetX + p.offsetX;
        const py = targetY + p.offsetY;

        p.x = px;
        p.y = py;

        // Draw dot in charcoal black
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 23, 42, ${p.opacity})`;
        ctx.fill();
      }

      // Draw faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password.",
        });
        return;
      }

      toast.success("Welcome back!", { description: "Redirecting to your dashboard..." });
      router.push("/overview");
      router.refresh();
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "analyst" | "viewer") => {
    const creds = {
      admin: { email: "admin@zipkart.io", password: "Admin@123!" },
      analyst: { email: "analyst@zipkart.io", password: "Analyst@123!" },
      viewer: { email: "viewer@zipkart.io", password: "Viewer@123!" },
    };
    setValue("email", creds[role].email);
    setValue("password", creds[role].password);
    setActiveRole(role);
  };

  const roles = [
    { key: "admin" as const, label: "Admin", emoji: "👑" },
    { key: "analyst" as const, label: "Analyst", emoji: "📊" },
    { key: "viewer" as const, label: "Viewer", emoji: "👁️" },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa]">
      {/* Particle background */}
      <ParticleCanvas />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "15%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md px-4" style={{ zIndex: 10 }}>
        {/* Floating badge */}
        <div className="flex justify-center mb-6">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999,
            background: "rgba(13,148,136,0.08)",
            border: "1px solid rgba(13,148,136,0.2)",
            fontSize: 12, color: "#0f766e",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}>
            <Sparkles size={12} className="text-teal-600 animate-pulse" />
            ZipKart Marketplace
          </div>
        </div>

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 16,
            marginBottom: 16,
            background: "linear-gradient(135deg, #0d9488, #0ea5e9)",
            boxShadow: "0 8px 24px rgba(13,148,136,0.2)",
          }}>
            <ShoppingBag size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: -0.5 }}>
            Welcome to ZipKart
          </h1>
          <p style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>Sign in to your marketplace analytics dashboard</p>
        </div>

        {/* Demo role buttons */}
        <div style={{
          background: "rgba(255, 255, 255, 0.7)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          borderRadius: 16, padding: "14px 16px", marginBottom: 20,
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)",
        }}>
          <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Quick demo access
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => fillDemo(r.key)}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10,
                  border: activeRole === r.key ? "1px solid rgba(13,148,136,0.5)" : "1px solid rgba(15, 23, 42, 0.08)",
                  background: activeRole === r.key ? "rgba(13,148,136,0.08)" : "rgba(255, 255, 255, 0.6)",
                  color: activeRole === r.key ? "#0f766e" : "#475569",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}
              >
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "rgba(255, 255, 255, 0.8)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          borderRadius: 20, padding: "28px 28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Email address
              </label>
              <input
                {...register("email")}
                id="login-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
                  background: "#ffffff",
                  border: errors.email ? "1px solid #ef4444" : "1px solid rgba(15, 23, 42, 0.12)",
                  color: "#0f172a", outline: "none", boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(13,148,136,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "rgba(15, 23, 42, 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {errors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  {...register("password")}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "11px 42px 11px 14px", borderRadius: 10, fontSize: 14,
                    background: "#ffffff",
                    border: errors.password ? "1px solid #ef4444" : "1px solid rgba(15, 23, 42, 0.12)",
                    color: "#0f172a", outline: "none", boxSizing: "border-box",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(13,148,136,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.password ? "#ef4444" : "rgba(15, 23, 42, 0.12)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: isLoading ? "rgba(13,148,136,0.5)" : "linear-gradient(135deg, #0d9488, #0f766e)",
                color: "white", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(13,148,136,0.25)",
                transition: "all 0.2s ease", marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(13,148,136,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(13,148,136,0.25)";
              }}
            >
              {isLoading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginTop: 20, fontWeight: 500 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </p>

        {/* Footer stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32 }}>
          {[["₹200Cr+", "GMV Tracked"], ["5M+", "Orders Analysed"], ["8", "Metro Cities"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f766e" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
