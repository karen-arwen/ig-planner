"use client";

import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/")).slice(0, 50);
    setPreviewFiles(imgs);
    setPreviewUrls(imgs.map((f) => URL.createObjectURL(f)));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: previewFiles.length > 0 ? "flex-start" : "center",
      padding: "1.5rem 1rem", gap: "1.5rem",
    }}>
      {previewFiles.length === 0 ? (
        /* ── Drop zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%", maxWidth: "480px",
            border: `2px dashed ${isDragging ? "#c084fc" : "rgba(192,132,252,0.25)"}`,
            borderRadius: "28px", cursor: "pointer",
            background: isDragging ? "rgba(192,132,252,0.06)" : "rgba(192,132,252,0.03)",
            transition: "all 0.2s",
            padding: "3rem 2rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem",
          }}
        >
          <div className="float" style={{
            width: "80px", height: "80px", borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(192,132,252,0.2), rgba(244,114,182,0.15))",
            border: "1px solid rgba(192,132,252,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.4rem",
          }}>
            🌸
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f5f0ff", marginBottom: "6px" }}>
              Arrasta suas fotos aqui
            </p>
            <p style={{ color: "#9b84b8", fontSize: "0.875rem" }}>
              ou clique para escolher • até 50 fotos 📸
            </p>
          </div>

          <button
            style={{
              background: "linear-gradient(135deg, #c084fc, #9333ea)",
              border: "none", borderRadius: "14px",
              padding: "12px 28px", color: "#fff",
              fontWeight: "700", fontSize: "0.95rem",
              cursor: "pointer",
            }}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Escolher fotos ✨
          </button>

          <p style={{ color: "#4a3660", fontSize: "0.78rem" }}>
            JPG, PNG, WEBP • 100% privado, nada é salvo em nuvem
          </p>
        </div>
      ) : (
        /* ── Preview before processing ── */
        <div style={{ width: "100%", maxWidth: "920px" }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px",
          }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#f5f0ff" }}>
                {previewFiles.length} fotos prontas 🎉
              </h2>
              <p style={{ color: "#9b84b8", fontSize: "0.82rem" }}>
                A Ami vai editar e organizar tudo automaticamente
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setPreviewFiles([]); setPreviewUrls([]); }}
                style={{
                  background: "transparent", border: "1px solid rgba(192,132,252,0.2)",
                  borderRadius: "10px", padding: "9px 16px",
                  color: "#9b84b8", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => onFilesSelected(previewFiles)}
                style={{
                  background: "linear-gradient(135deg, #c084fc, #9333ea)",
                  border: "none", borderRadius: "10px",
                  padding: "9px 22px", color: "#fff",
                  fontWeight: "800", cursor: "pointer", fontSize: "0.9rem",
                  boxShadow: "0 0 24px rgba(192,132,252,0.35)",
                }}
              >
                ✨ Processar com Ami
              </button>
            </div>
          </div>

          {/* Grid preview */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "6px",
          }}>
            {previewUrls.map((url, i) => (
              <div key={i} style={{
                aspectRatio: "1", borderRadius: "12px", overflow: "hidden",
                background: "#18101f", position: "relative",
              }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)",
                }} />
                <span style={{
                  position: "absolute", bottom: "4px", right: "6px",
                  color: "rgba(255,255,255,0.5)", fontSize: "0.65rem",
                }}>
                  {i + 1}
                </span>
              </div>
            ))}

            {/* Add more */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                aspectRatio: "1", borderRadius: "12px",
                border: "2px dashed rgba(192,132,252,0.2)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", gap: "4px",
                color: "#4a3660", fontSize: "0.72rem",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(192,132,252,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(192,132,252,0.2)"; }}
            >
              <span style={{ fontSize: "1.4rem" }}>+</span>
              <span>mais</span>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFiles([...previewFiles, ...files].slice(0, 50));
        }}
      />
    </div>
  );
}
