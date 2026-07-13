"use client";

import { useState, useEffect } from "react";
import type { Photo } from "@/types";
import { fileToBase64 } from "@/lib/imageUtils";

interface IGStatus {
  connected: boolean;
  username?: string;
  profilePicture?: string;
  followersCount?: number;
}

interface Props {
  photos: Photo[];
  onPublished: (photoId: string) => void;
}

export default function InstagramPanel({ photos, onPublished }: Props) {
  const [status, setStatus] = useState<IGStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/instagram/status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Check URL params for connection result
    const params = new URLSearchParams(window.location.search);
    if (params.get("ig_connected")) {
      window.history.replaceState({}, "", window.location.pathname);
      fetch("/api/instagram/status").then((r) => r.json()).then(setStatus);
    }
    if (params.get("ig_error")) {
      setError("Erro ao conectar Instagram. Tente novamente.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const approvedPhotos = photos.filter((p) => p.approved && !publishedIds.has(p.id));

  const handlePublish = async (photo: Photo) => {
    if (!photo.file) {
      setError("Arquivo da foto não encontrado. Faça upload novamente.");
      return;
    }
    setPublishing(photo.id);
    setError("");
    try {
      const base64 = await fileToBase64(photo.file);
      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          base64,
          mimeType: photo.file.type || "image/jpeg",
          caption: [photo.caption, ...photo.hashtags.map((h) => `#${h}`)].filter(Boolean).join("\n\n"),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPublishedIds((prev) => new Set([...prev, photo.id]));
      onPublished(photo.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishAll = async () => {
    for (const photo of approvedPhotos) {
      await handlePublish(photo);
      await new Promise((r) => setTimeout(r, 1500)); // Rate limit
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/instagram/status", { method: "DELETE" });
    setStatus({ connected: false });
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ color: "#9b84b8", fontSize: "0.85rem" }}>Verificando conexão...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg, #f472b6, #fb923c, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
        }}>
          📸
        </div>
        <div>
          <p style={{ fontWeight: "800", fontSize: "0.9rem", color: "#f5f0ff" }}>Instagram</p>
          <p style={{ color: "#9b84b8", fontSize: "0.72rem" }}>
            {status.connected ? `@${status.username}` : "Não conectado"}
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: "10px", padding: "10px 12px", marginBottom: "12px",
          color: "#fca5a5", fontSize: "0.8rem",
        }}>
          ⚠️ {error}
          {error.includes("Vercel") && (
            <a href="https://vercel.com" target="_blank" style={{ color: "#c084fc", marginLeft: "6px" }}>
              Deploy aqui →
            </a>
          )}
        </div>
      )}

      {!status.connected ? (
        /* Connect */
        <div style={{
          background: "rgba(192,132,252,0.06)",
          border: "1px solid rgba(192,132,252,0.15)",
          borderRadius: "16px", padding: "16px", textAlign: "center",
        }}>
          <p style={{ color: "#9b84b8", fontSize: "0.82rem", marginBottom: "12px", lineHeight: "1.6" }}>
            Conecte sua conta <strong style={{ color: "#f5f0ff" }}>Instagram Profissional</strong> para publicar direto pelo Postaí.
          </p>
          <button
            onClick={() => window.location.href = "/api/instagram/auth"}
            style={{
              background: "linear-gradient(135deg, #f472b6, #fb923c)",
              border: "none", borderRadius: "12px",
              padding: "10px 20px", color: "#fff",
              fontWeight: "700", cursor: "pointer", fontSize: "0.875rem",
              width: "100%",
            }}
          >
            Conectar Instagram 📲
          </button>
          <p style={{ color: "#4a3660", fontSize: "0.72rem", marginTop: "10px" }}>
            Requer conta Business ou Creator • Funciona após deploy no Vercel
          </p>
        </div>
      ) : (
        /* Connected */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Account info */}
          <div style={{
            background: "rgba(134,239,172,0.06)",
            border: "1px solid rgba(134,239,172,0.2)",
            borderRadius: "14px", padding: "12px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            {status.profilePicture && (
              <img src={status.profilePicture} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ color: "#86efac", fontWeight: "700", fontSize: "0.875rem" }}>✓ Conectado</p>
              <p style={{ color: "#9b84b8", fontSize: "0.75rem" }}>
                @{status.username} • {status.followersCount?.toLocaleString("pt-BR")} seguidores
              </p>
            </div>
            <button onClick={handleDisconnect} style={{
              background: "none", border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "8px", padding: "4px 10px",
              color: "#f87171", fontSize: "0.72rem", cursor: "pointer",
            }}>
              Desconectar
            </button>
          </div>

          {/* Posts to publish */}
          {approvedPhotos.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "16px",
              color: "#4a3660", fontSize: "0.82rem",
            }}>
              {publishedIds.size > 0
                ? `🎉 ${publishedIds.size} post${publishedIds.size > 1 ? "s publicados" : " publicado"}!`
                : "Aprove fotos para publicar"}
            </div>
          ) : (
            <>
              <button
                onClick={handlePublishAll}
                disabled={!!publishing}
                style={{
                  background: publishing ? "rgba(192,132,252,0.1)" : "linear-gradient(135deg, #f472b6, #fb923c)",
                  border: "none", borderRadius: "12px",
                  padding: "11px", color: "#fff",
                  fontWeight: "800", cursor: publishing ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {publishing ? "Publicando..." : `Publicar ${approvedPhotos.length} post${approvedPhotos.length > 1 ? "s" : ""} agora 🚀`}
              </button>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {approvedPhotos.map((photo) => (
                  <div key={photo.id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(192,132,252,0.1)",
                    borderRadius: "12px", padding: "10px",
                  }}>
                    <img
                      src={photo.originalUrl || photo.previewUrl}
                      alt="" style={{
                        width: "44px", height: "44px",
                        borderRadius: "8px", objectFit: "cover", flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{
                        color: "#e2d9f5", fontSize: "0.78rem",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {photo.caption || "Sem legenda"}
                      </p>
                      {photo.scheduledDate && (
                        <p style={{ color: "#4a3660", fontSize: "0.7rem" }}>
                          {new Date(photo.scheduledDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handlePublish(photo)}
                      disabled={publishing === photo.id}
                      style={{
                        background: "linear-gradient(135deg, #f472b6, #9333ea)",
                        border: "none", borderRadius: "8px",
                        padding: "6px 12px", color: "#fff",
                        fontSize: "0.72rem", fontWeight: "700",
                        cursor: "pointer", flexShrink: 0,
                        opacity: publishing === photo.id ? 0.5 : 1,
                      }}
                    >
                      {publishing === photo.id ? "..." : "Publicar"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
