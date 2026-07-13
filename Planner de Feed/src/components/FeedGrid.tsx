"use client";

import { useState } from "react";
import type { Photo } from "@/types";
import { buildCSSFilter, formatScheduleDate } from "@/lib/imageUtils";

interface FeedGridProps {
  photos: Photo[];
  onReorder: (photos: Photo[]) => void;
  onPhotoClick: (photo: Photo) => void;
  onApprove: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

export default function FeedGrid({
  photos,
  onReorder,
  onPhotoClick,
  onApprove,
  onDelete,
}: FeedGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, photo: Photo) => {
    setDraggingId(photo.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, photo: Photo) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (photo.id !== draggingId) {
      setDragOverId(photo.id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPhoto: Photo) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetPhoto.id) return;

    const dragIdx = photos.findIndex((p) => p.id === draggingId);
    const dropIdx = photos.findIndex((p) => p.id === targetPhoto.id);

    if (dragIdx === -1 || dropIdx === -1) return;

    const newPhotos = [...photos];
    const [dragged] = newPhotos.splice(dragIdx, 1);
    newPhotos.splice(dropIdx, 0, dragged);
    onReorder(newPhotos.map((p, i) => ({ ...p, position: i })));

    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const categoryColors: Record<string, string> = {
    selfie: "#f472b6",
    look: "#fb923c",
    product: "#818cf8",
    travel: "#34d399",
    food: "#fbbf24",
    event: "#c084fc",
    lifestyle: "#a78bfa",
    other: "#6b7280",
  };

  const sortedPhotos = [...photos].sort((a, b) => a.position - b.position);

  return (
    <div>
      {/* Instagram-style 3-col grid preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "linear-gradient(135deg, #c084fc, #f472b6)",
          }} />
          <span style={{ color: "#9b84b8", fontSize: "0.82rem" }}>
            Preview do feed ({photos.length} posts)
          </span>
        </div>
        <span style={{ color: "#4a3660", fontSize: "0.75rem" }}>
          ↕ arraste pra reordenar
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "3px",
          borderRadius: "20px",
          overflow: "hidden",
          background: "#0d0918",
          border: "1px solid rgba(192,132,252,0.12)",
        }}
      >
        {sortedPhotos.map((photo, index) => {
          const isDragging = draggingId === photo.id;
          const isDragOver = dragOverId === photo.id;
          const isHovered = hoveredId === photo.id;

          return (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo)}
              onDragOver={(e) => handleDragOver(e, photo)}
              onDrop={(e) => handleDrop(e, photo)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: "relative",
                aspectRatio: "1",
                cursor: "grab",
                opacity: isDragging ? 0.3 : 1,
                transform: isDragOver ? "scale(0.97)" : "scale(1)",
                transition: "all 0.15s",
                outline: isDragOver ? "2px solid #a855f7" : "none",
                background: "#1a1a1a",
              }}
            >
              {/* Photo */}
              <img
                src={photo.originalUrl || photo.previewUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: buildCSSFilter(photo.filter),
                  transition: "filter 0.2s",
                }}
              />

              {/* Position number */}
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  background: "rgba(0,0,0,0.7)",
                  borderRadius: "6px",
                  padding: "2px 7px",
                  fontSize: "0.7rem",
                  color: "#aaa",
                  backdropFilter: "blur(4px)",
                }}
              >
                {index + 1}
              </div>

              {/* Category badge */}
              {photo.analysis?.category && (
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: categoryColors[photo.analysis.category] || "#6b7280",
                    borderRadius: "5px",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    color: "#fff",
                    fontWeight: "600",
                  }}
                >
                  {photo.analysis.category}
                </div>
              )}

              {/* Approved badge */}
              {photo.approved && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "6px",
                    background: "rgba(34,197,94,0.9)",
                    borderRadius: "5px",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    color: "#fff",
                    fontWeight: "600",
                  }}
                >
                  ✓
                </div>
              )}

              {/* Scheduled date */}
              {photo.scheduledDate && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    background: "rgba(0,0,0,0.8)",
                    borderRadius: "5px",
                    padding: "2px 6px",
                    fontSize: "0.6rem",
                    color: "#aaa",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {formatScheduleDate(photo.scheduledDate)}
                </div>
              )}

              {/* Hover overlay */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  {photo.caption && (
                    <p
                      style={{
                        color: "#fff",
                        fontSize: "0.7rem",
                        textAlign: "center",
                        padding: "0 8px",
                        lineHeight: "1.4",
                        maxHeight: "60px",
                        overflow: "hidden",
                      }}
                    >
                      {photo.caption.slice(0, 80)}{photo.caption.length > 80 ? "..." : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPhotoClick(photo); }}
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        color: "#fff",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onApprove(photo.id); }}
                      style={{
                        background: photo.approved ? "rgba(134,239,172,0.25)" : "rgba(255,255,255,0.15)",
                        border: `1px solid ${photo.approved ? "rgba(134,239,172,0.5)" : "rgba(255,255,255,0.2)"}`,
                        borderRadius: "8px",
                        padding: "5px 10px",
                        color: "#fff",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {photo.approved ? "✓" : "Aprovar"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      {photos.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "10px",
            padding: "10px 14px",
            background: "rgba(192,132,252,0.04)",
            borderRadius: "12px",
            border: "1px solid rgba(192,132,252,0.1)",
          }}
        >
          {Object.entries(
            photos.reduce<Record<string, number>>((acc, p) => {
              const cat = p.analysis?.category || "other";
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {})
          ).map(([cat, count]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: categoryColors[cat] || "#6b7280",
                }}
              />
              <span style={{ fontSize: "0.78rem", color: "#666" }}>
                {count} {cat}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
