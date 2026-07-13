"use client";

import { useState } from "react";
import type { Photo, PhotoFilter } from "@/types";
import { buildCSSFilter, formatScheduleDate } from "@/lib/imageUtils";

interface PhotoDetailModalProps {
  photo: Photo;
  onClose: () => void;
  onSave: (photo: Photo) => void;
}

export default function PhotoDetailModal({ photo, onClose, onSave }: PhotoDetailModalProps) {
  const [editedPhoto, setEditedPhoto] = useState<Photo>({ ...photo });
  const [activeTab, setActiveTab] = useState<"edit" | "caption" | "schedule">("edit");

  const updateFilter = (key: keyof PhotoFilter, value: number) => {
    setEditedPhoto((prev) => ({
      ...prev,
      filter: { ...prev.filter, [key]: value },
    }));
  };

  const FilterSlider = ({
    label,
    filterKey,
    min = 50,
    max = 200,
    defaultVal = 100,
  }: {
    label: string;
    filterKey: keyof PhotoFilter;
    min?: number;
    max?: number;
    defaultVal?: number;
  }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", color: "#888" }}>{label}</span>
        <span style={{ fontSize: "0.8rem", color: "#d8b4fe" }}>
          {editedPhoto.filter[filterKey]}
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={editedPhoto.filter[filterKey]}
          onChange={(e) => updateFilter(filterKey, Number(e.target.value))}
          style={{ flex: 1, accentColor: "#c084fc" }}
        />
        <button
          onClick={() => updateFilter(filterKey, defaultVal)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            padding: "2px 8px",
            color: "#555",
            fontSize: "0.7rem",
            cursor: "pointer",
          }}
        >
          reset
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,2,10,0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="slide-up"
        style={{
          background: "#120d1c",
          borderRadius: "24px",
          border: "1px solid rgba(192,132,252,0.15)",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(192,132,252,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#eee" }}>
              Editar foto
            </h3>
            {photo.analysis && (
              <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "2px" }}>
                {photo.analysis.category} • qualidade: {photo.analysis.quality}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: "1.4rem",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Photo preview */}
          <div
            style={{
              width: "340px",
              flexShrink: 0,
              background: "#0a0a0a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "260px",
                height: "260px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#1a1a1a",
                position: "relative",
              }}
            >
              <img
                src={editedPhoto.originalUrl || editedPhoto.previewUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: buildCSSFilter(editedPhoto.filter),
                  transition: "filter 0.1s",
                }}
              />
            </div>

            {/* AI edit suggestion */}
            {photo.analysis?.editSuggestion && (
              <div
                style={{
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  width: "260px",
                }}
              >
                <p style={{ color: "#888", fontSize: "0.7rem", marginBottom: "4px" }}>
                  💡 Sugestão da IA
                </p>
                <p style={{ color: "#d8b4fe", fontSize: "0.8rem" }}>
                  {photo.analysis.editSuggestion}
                </p>
              </div>
            )}
          </div>

          {/* Edit panel */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "20px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                padding: "4px",
              }}
            >
              {(["edit", "caption", "schedule"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    background: activeTab === tab ? "rgba(168,85,247,0.2)" : "none",
                    border: activeTab === tab ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                    borderRadius: "8px",
                    padding: "8px",
                    color: activeTab === tab ? "#d8b4fe" : "#666",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: activeTab === tab ? "600" : "400",
                    transition: "all 0.15s",
                  }}
                >
                  {tab === "edit" ? "✨ Ajustes" : tab === "caption" ? "📝 Legenda" : "📅 Data"}
                </button>
              ))}
            </div>

            {activeTab === "edit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <FilterSlider label="☀️ Brilho" filterKey="brightness" />
                <FilterSlider label="◐ Contraste" filterKey="contrast" />
                <FilterSlider label="🎨 Saturação" filterKey="saturation" />
                <FilterSlider
                  label="🌡️ Temperatura"
                  filterKey="warmth"
                  min={-50}
                  max={50}
                  defaultVal={0}
                />

                {/* Reset all */}
                <button
                  onClick={() => {
                    setEditedPhoto((prev) => ({
                      ...prev,
                      filter: { brightness: 100, contrast: 100, saturation: 100, warmth: 0, sharpness: 100 },
                    }));
                  }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    padding: "10px",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Resetar todos os ajustes
                </button>
              </div>
            )}

            {activeTab === "caption" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#888", display: "block", marginBottom: "8px" }}>
                    Legenda
                  </label>
                  <textarea
                    value={editedPhoto.caption}
                    onChange={(e) => setEditedPhoto((prev) => ({ ...prev, caption: e.target.value }))}
                    rows={4}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid #2a2a2a",
                      borderRadius: "10px",
                      padding: "12px",
                      color: "#eee",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: "1.5",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#a855f7"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#2a2a2a"; }}
                  />
                  <p style={{ color: "#444", fontSize: "0.75rem", marginTop: "4px" }}>
                    {editedPhoto.caption.length} caracteres
                  </p>
                </div>

                {/* AI suggestion */}
                {photo.analysis?.suggestedCaption && photo.analysis.suggestedCaption !== editedPhoto.caption && (
                  <div
                    style={{
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: "10px",
                      padding: "12px",
                    }}
                  >
                    <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "6px" }}>
                      Sugestão da IA:
                    </p>
                    <p style={{ color: "#d8b4fe", fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {photo.analysis.suggestedCaption}
                    </p>
                    <button
                      onClick={() => {
                        setEditedPhoto((prev) => ({
                          ...prev,
                          caption: photo.analysis!.suggestedCaption,
                        }));
                      }}
                      style={{
                        background: "rgba(168,85,247,0.2)",
                        border: "1px solid rgba(168,85,247,0.3)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        color: "#d8b4fe",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        marginTop: "8px",
                      }}
                    >
                      Usar essa legenda
                    </button>
                  </div>
                )}

                {/* Hashtags */}
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#888", display: "block", marginBottom: "8px" }}>
                    Hashtags
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {editedPhoto.hashtags.map((tag, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(168,85,247,0.1)",
                          border: "1px solid rgba(168,85,247,0.2)",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                          color: "#d8b4fe",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        #{tag}
                        <button
                          onClick={() => {
                            setEditedPhoto((prev) => ({
                              ...prev,
                              hashtags: prev.hashtags.filter((_, idx) => idx !== i),
                            }));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#555",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {editedPhoto.scheduledDate && (
                  <div
                    style={{
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "4px" }}>
                      Agendado para
                    </p>
                    <p style={{ color: "#d8b4fe", fontSize: "1.1rem", fontWeight: "600" }}>
                      {formatScheduleDate(editedPhoto.scheduledDate)}
                    </p>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#888", display: "block", marginBottom: "8px" }}>
                    Alterar data
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      editedPhoto.scheduledDate
                        ? new Date(editedPhoto.scheduledDate.getTime() - editedPhoto.scheduledDate.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      setEditedPhoto((prev) => ({
                        ...prev,
                        scheduledDate: e.target.value ? new Date(e.target.value) : undefined,
                      }));
                    }}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid #2a2a2a",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      color: "#eee",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>

                {photo.analysis?.bestTimeToPost && (
                  <div
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "10px",
                      padding: "12px",
                    }}
                  >
                    <p style={{ color: "#86efac", fontSize: "0.85rem" }}>
                      💡 Melhor horário sugerido pela IA: <strong>{photo.analysis.bestTimeToPost}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #1e1e1e",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid #2a2a2a",
              borderRadius: "10px",
              padding: "10px 20px",
              color: "#888",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              setEditedPhoto((prev) => ({ ...prev, approved: true }));
              onSave({ ...editedPhoto, approved: true });
            }}
            style={{
              background: "rgba(34,197,94,0.2)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "10px",
              padding: "10px 20px",
              color: "#86efac",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            ✓ Salvar e aprovar
          </button>
          <button
            onClick={() => onSave(editedPhoto)}
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              border: "none",
              borderRadius: "10px",
              padding: "10px 24px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "700",
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
