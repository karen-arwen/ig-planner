"use client";

import { useRouter } from "next/navigation";

interface TopBarProps {
  photoCount: number;
  approvedCount: number;
  viewMode: "upload" | "processing" | "feed" | "approved";
  onUploadMore: () => void;
  onApproveAll: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  igPanelOpen?: boolean;
  onToggleIG?: () => void;
  onClearAll?: () => void;
}

export default function TopBar({
  photoCount,
  approvedCount,
  viewMode,
  onUploadMore,
  onApproveAll,
  chatOpen,
  onToggleChat,
  igPanelOpen,
  onToggleIG,
  onClearAll,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header style={{
      background: "rgba(15,10,20,0.92)",
      borderBottom: "1px solid rgba(192,132,252,0.12)",
      backdropFilter: "blur(16px)",
      padding: "0 1rem",
      height: "56px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      gap: "8px",
    }}>
      {/* Logo */}
      <button
        onClick={() => router.push("/")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "8px", flexShrink: 0,
        }}
      >
        <div style={{
          width: "30px", height: "30px", borderRadius: "10px",
          background: "linear-gradient(135deg, #c084fc, #9333ea)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "15px",
        }}>
          🌸
        </div>
        <span style={{
          fontSize: "1.15rem", fontWeight: "900",
          background: "linear-gradient(135deg, #f5f0ff, #c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px",
        }}>
          Postaí
        </span>
      </button>

      {/* Center stats */}
      {photoCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            background: "rgba(192,132,252,0.12)", border: "1px solid rgba(192,132,252,0.2)",
            borderRadius: "100px", padding: "3px 10px",
            color: "#c084fc", fontSize: "0.78rem", fontWeight: "600",
          }}>
            {photoCount} fotos
          </span>
          {approvedCount > 0 && (
            <span style={{
              background: "rgba(134,239,172,0.1)", border: "1px solid rgba(134,239,172,0.2)",
              borderRadius: "100px", padding: "3px 10px",
              color: "#86efac", fontSize: "0.78rem", fontWeight: "600",
            }}>
              ✓ {approvedCount}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
        {(viewMode === "feed" || viewMode === "approved") && (
          <>
            <button
              onClick={onUploadMore}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(192,132,252,0.15)",
                borderRadius: "10px", padding: "6px 12px",
                color: "#9b84b8", fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              + fotos
            </button>

            <button
              onClick={onToggleChat}
              style={{
                background: chatOpen ? "rgba(192,132,252,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${chatOpen ? "rgba(192,132,252,0.4)" : "rgba(192,132,252,0.15)"}`,
                borderRadius: "10px", padding: "6px 12px",
                color: chatOpen ? "#c084fc" : "#9b84b8",
                fontSize: "0.8rem", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              🤖 Ami
            </button>

            {onToggleIG && (
              <button
                onClick={onToggleIG}
                style={{
                  background: igPanelOpen ? "rgba(244,114,182,0.18)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${igPanelOpen ? "rgba(244,114,182,0.4)" : "rgba(192,132,252,0.15)"}`,
                  borderRadius: "10px", padding: "6px 12px",
                  color: igPanelOpen ? "#f472b6" : "#9b84b8",
                  fontSize: "0.8rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                📸 IG
              </button>
            )}

            {viewMode === "feed" && (
              <button
                onClick={onApproveAll}
                style={{
                  background: "linear-gradient(135deg, #86efac, #22c55e)",
                  border: "none", borderRadius: "10px",
                  padding: "6px 14px",
                  color: "#052e16", fontSize: "0.8rem", fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(134,239,172,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ Aprovar
              </button>
            )}

            {onClearAll && (
              <button
                onClick={() => { if (confirm("Limpar tudo e começar do zero?")) onClearAll(); }}
                style={{
                  background: "none",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: "10px", padding: "6px 10px",
                  color: "#f87171", fontSize: "0.75rem", cursor: "pointer",
                }}
                title="Limpar tudo"
              >
                🗑️
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
