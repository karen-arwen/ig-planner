"use client";

import { useEffect, useState } from "react";

interface Props { progress: number; message: string; photoCount: number; }

const STEPS = [
  { threshold: 0,  icon: "📤", label: "Carregando fotos" },
  { threshold: 15, icon: "👀", label: "Analisando com IA" },
  { threshold: 40, icon: "🪄", label: "Editando automaticamente" },
  { threshold: 70, icon: "🎨", label: "Organizando o feed" },
  { threshold: 90, icon: "📅", label: "Montando calendário" },
  { threshold: 98, icon: "✅", label: "Finalizando" },
];

export default function ProcessingOverlay({ progress, message, photoCount }: Props) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 450);
    return () => clearInterval(t);
  }, []);

  const currentStep = STEPS.filter((s) => progress >= s.threshold).pop() ?? STEPS[0];

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", gap: "1.8rem",
    }}>
      {/* Animated icon */}
      <div style={{ position: "relative" }}>
        <div className="float" style={{
          width: "96px", height: "96px", borderRadius: "28px",
          background: "linear-gradient(135deg, rgba(192,132,252,0.2), rgba(244,114,182,0.15))",
          border: "1px solid rgba(192,132,252,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2.8rem",
          boxShadow: "0 0 40px rgba(192,132,252,0.2)",
        }}>
          {currentStep.icon}
        </div>
        {/* Spinning ring */}
        <div style={{
          position: "absolute", inset: "-4px",
          borderRadius: "32px",
          border: "2px solid transparent",
          borderTopColor: "#c084fc",
          borderRightColor: "rgba(192,132,252,0.3)",
        }} className="spin" />
      </div>

      {/* Text */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#f5f0ff", marginBottom: "6px" }}>
          {message}{dots}
        </h2>
        <p style={{ color: "#9b84b8", fontSize: "0.875rem" }}>
          A Ami está cuidando das suas {photoCount} fotos 💜
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{
          height: "8px", background: "rgba(192,132,252,0.1)",
          borderRadius: "100px", overflow: "hidden",
          border: "1px solid rgba(192,132,252,0.1)",
        }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #9333ea, #c084fc, #f472b6)",
            borderRadius: "100px", transition: "width 0.6s ease",
            boxShadow: "0 0 12px rgba(192,132,252,0.6)",
          }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: "6px",
        }}>
          <span style={{ color: "#4a3660", fontSize: "0.75rem" }}>0%</span>
          <span style={{ color: "#c084fc", fontSize: "0.82rem", fontWeight: "700" }}>{progress}%</span>
          <span style={{ color: "#4a3660", fontSize: "0.75rem" }}>100%</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "8px",
        width: "100%", maxWidth: "300px",
      }}>
        {STEPS.map((step) => {
          const done   = progress > step.threshold + 5;
          const active = currentStep.threshold === step.threshold;
          return (
            <div key={step.label} style={{
              display: "flex", alignItems: "center", gap: "10px",
              opacity: done || active ? 1 : 0.25,
              transition: "opacity 0.4s",
            }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                background: done ? "rgba(134,239,172,0.2)" : active ? "rgba(192,132,252,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${done ? "#86efac" : active ? "#c084fc" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: "700",
                color: done ? "#86efac" : active ? "#c084fc" : "#555",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : active ? "●" : "○"}
              </div>
              <span style={{
                fontSize: "0.82rem",
                color: done ? "#86efac" : active ? "#d8b4fe" : "#4a3660",
              }}>
                {step.icon} {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
