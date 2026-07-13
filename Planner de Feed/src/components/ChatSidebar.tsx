"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";

interface QuickAction { label: string; prompt: string; }

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClose: () => void;
  quickActions: QuickAction[];
}

export default function ChatSidebar({ messages, onSendMessage, onClose, quickActions }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);
    try { await onSendMessage(msg); } finally { setLoading(false); }
  };

  return (
    <div className="slide-up" style={{
      width: "320px", flexShrink: 0,
      borderLeft: "1px solid rgba(192,132,252,0.1)",
      background: "rgba(15,10,20,0.97)",
      display: "flex", flexDirection: "column",
      /* full height on desktop, slide-over on mobile handled by parent */
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(192,132,252,0.1)",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "12px", flexShrink: 0,
          background: "linear-gradient(135deg, #c084fc, #f472b6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 0 16px rgba(192,132,252,0.3)",
        }}>
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "800", fontSize: "0.9rem", color: "#f5f0ff" }}>Ami</p>
          <p style={{ color: "#9b84b8", fontSize: "0.72rem" }}>sua assistente de feed 💜</p>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none",
          color: "#4a3660", cursor: "pointer", fontSize: "1.1rem",
          width: "28px", height: "28px", display: "flex",
          alignItems: "center", justifyContent: "center",
          borderRadius: "8px", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(192,132,252,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: "auto", padding: "14px",
        display: "flex", flexDirection: "column", gap: "10px",
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: "24px", height: "24px", borderRadius: "8px", flexShrink: 0,
                background: "linear-gradient(135deg, #c084fc, #f472b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", marginRight: "6px", alignSelf: "flex-end",
              }}>
                🤖
              </div>
            )}
            <div style={{
              maxWidth: "82%",
              padding: "9px 13px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #9333ea, #7c3aed)"
                : "rgba(192,132,252,0.08)",
              border: msg.role === "assistant" ? "1px solid rgba(192,132,252,0.15)" : "none",
              fontSize: "0.85rem", lineHeight: "1.5",
              color: msg.role === "user" ? "#fff" : "#e2d9f5",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "24px", height: "24px", borderRadius: "8px",
              background: "linear-gradient(135deg, #c084fc, #f472b6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px",
            }}>
              🤖
            </div>
            <div style={{
              padding: "9px 14px",
              borderRadius: "16px 16px 16px 4px",
              background: "rgba(192,132,252,0.08)",
              border: "1px solid rgba(192,132,252,0.15)",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#c084fc",
                  animation: `bounce-dot 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid rgba(192,132,252,0.08)",
        display: "flex", flexWrap: "wrap", gap: "5px",
      }}>
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={loading}
            style={{
              background: "rgba(192,132,252,0.07)",
              border: "1px solid rgba(192,132,252,0.18)",
              borderRadius: "100px", padding: "5px 10px",
              color: "#c084fc", fontSize: "0.72rem",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(192,132,252,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(192,132,252,0.07)"; }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid rgba(192,132,252,0.1)",
        display: "flex", gap: "8px", alignItems: "flex-end",
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pede qualquer coisa pra Ami..."
          rows={1}
          style={{
            flex: 1, background: "rgba(192,132,252,0.06)",
            border: "1px solid rgba(192,132,252,0.15)",
            borderRadius: "12px", padding: "9px 13px",
            color: "#f5f0ff", fontSize: "0.85rem",
            resize: "none", outline: "none", fontFamily: "inherit",
            lineHeight: "1.4", transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#c084fc"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(192,132,252,0.15)"; }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading
              ? "linear-gradient(135deg, #c084fc, #9333ea)"
              : "rgba(255,255,255,0.04)",
            border: "none", borderRadius: "12px",
            width: "38px", height: "38px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontSize: "1rem", transition: "all 0.15s",
            color: "#fff",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
