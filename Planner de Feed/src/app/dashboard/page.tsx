"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Photo, ChatMessage, AIAnalysis } from "@/types";
import { generateId, DEFAULT_FILTER, applyAISuggestions, calculateScheduleDates, formatScheduleDate } from "@/lib/imageUtils";
import { fileToBase64 } from "@/lib/imageUtils";
import {
  saveImageToDB, loadImageFromDB, deleteImageFromDB,
  saveMetaToLS, loadMetaFromLS, saveViewMode, loadViewMode,
  clearStorage, type SerializedPhoto,
} from "@/lib/storage";
import FeedGrid from "@/components/FeedGrid";
import ChatSidebar from "@/components/ChatSidebar";
import PhotoDetailModal from "@/components/PhotoDetailModal";
import UploadZone from "@/components/UploadZone";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import TopBar from "@/components/TopBar";
import InstagramPanel from "@/components/InstagramPanel";

type ViewMode = "upload" | "processing" | "feed" | "approved";

export default function Dashboard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Oi! 🌸 Sou a Ami, sua assistente de feed. Suba as fotos e eu cuido do resto! Reorganizo, mudo legendas, ajusto datas — qualquer coisa que você precisar. 💜",
      timestamp: new Date(),
    },
  ]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [igPanelOpen, setIgPanelOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [restored, setRestored] = useState(false);

  // ── Restore saved state on mount ──────────────────────────────────────────
  useEffect(() => {
    async function restore() {
      const savedMeta = loadMetaFromLS();
      const savedView = loadViewMode() as ViewMode | null;
      if (savedMeta.length === 0) { setRestored(true); return; }

      const restored: Photo[] = await Promise.all(
        savedMeta.map(async (m: SerializedPhoto) => {
          const img = await loadImageFromDB(m.id);
          return {
            id: m.id,
            originalUrl: img?.url || "",
            previewUrl: img?.url || "",
            status: m.status as Photo["status"],
            filter: m.filter as Photo["filter"],
            analysis: m.analysis as Photo["analysis"],
            caption: m.caption,
            hashtags: m.hashtags,
            scheduledDate: m.scheduledDate ? new Date(m.scheduledDate) : undefined,
            position: m.position,
            approved: m.approved,
            feedPosition: m.feedPosition,
          };
        })
      );

      const valid = restored.filter((p) => p.originalUrl);
      if (valid.length > 0) {
        setPhotos(valid);
        setViewMode(savedView === "feed" || savedView === "approved" ? savedView : "feed");
      }
      setRestored(true);
    }
    restore();
  }, []);

  // ── Auto-save whenever photos change ─────────────────────────────────────
  useEffect(() => {
    if (!restored || photos.length === 0) return;
    const meta: SerializedPhoto[] = photos.map((p) => ({
      id: p.id,
      filter: p.filter,
      analysis: p.analysis as Record<string, unknown> | undefined,
      caption: p.caption,
      hashtags: p.hashtags,
      scheduledDate: p.scheduledDate?.toISOString(),
      position: p.position,
      approved: p.approved,
      feedPosition: p.feedPosition,
      status: p.status,
    }));
    saveMetaToLS(meta);
  }, [photos, restored]);

  useEffect(() => {
    if (viewMode !== "processing") saveViewMode(viewMode);
  }, [viewMode]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setViewMode("processing");
    setProcessingProgress(0);
    setProcessingMessage("Carregando suas fotos...");

    // Create initial photo objects
    const newPhotos: Photo[] = files.map((file, index) => ({
      id: generateId(),
      file,
      originalUrl: URL.createObjectURL(file),
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      filter: { ...DEFAULT_FILTER },
      caption: "",
      hashtags: [],
      position: index,
      approved: false,
    }));

    setPhotos(newPhotos);
    setProcessingProgress(10);
    setProcessingMessage(`Analisando ${files.length} fotos com IA...`);

    // Save images to IndexedDB immediately
    await Promise.all(newPhotos.map((p, i) => saveImageToDB(p.id, files[i])));

    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    const updatedPhotos = [...newPhotos];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPhotos = newPhotos.slice(i, i + batchSize);

      // Convert to base64
      const photoData = await Promise.all(
        batch.map(async (file, idx) => ({
          id: batchPhotos[idx].id,
          base64: await fileToBase64(file),
          mimeType: file.type || "image/jpeg",
        }))
      );

      try {
        const response = await fetch("/api/analyze-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos: photoData }),
        });

        if (response.ok) {
          const { results } = await response.json();

          results.forEach((result: { id: string; analysis: Record<string, unknown> }) => {
            const photoIdx = updatedPhotos.findIndex((p) => p.id === result.id);
            if (photoIdx !== -1 && result.analysis) {
              const analysis = result.analysis as {
                category?: string;
                quality?: string;
                description?: string;
                suggestedCaption?: string;
                hashtags?: string[];
                editSuggestion?: string;
                colorPalette?: string[];
                bestTimeToPost?: string;
                brightness?: number;
                contrast?: number;
                saturation?: number;
                warmth?: number;
              };
              updatedPhotos[photoIdx] = {
                ...updatedPhotos[photoIdx],
                status: "enhanced",
                analysis: {
                  category: (analysis.category as AIAnalysis["category"]) || "lifestyle",
                  quality: (analysis.quality as AIAnalysis["quality"]) || "good",
                  description: analysis.description || "",
                  suggestedCaption: analysis.suggestedCaption || "",
                  hashtags: analysis.hashtags || [],
                  editSuggestion: analysis.editSuggestion || "",
                  colorPalette: analysis.colorPalette || [],
                  bestTimeToPost: analysis.bestTimeToPost,
                },
                caption: analysis.suggestedCaption || "",
                hashtags: analysis.hashtags || [],
                filter: applyAISuggestions(DEFAULT_FILTER, {
                  brightness: analysis.brightness,
                  contrast: analysis.contrast,
                  saturation: analysis.saturation,
                  warmth: analysis.warmth,
                }),
              };
            }
          });
        }
      } catch (err) {
        console.error("Batch analysis failed:", err);
      }

      const progress = 10 + Math.round(((i + batchSize) / files.length) * 60);
      setProcessingProgress(Math.min(70, progress));
      setProcessingMessage(
        `Editando fotos... ${Math.min(i + batchSize, files.length)} de ${files.length}`
      );
    }

    setProcessingProgress(75);
    setProcessingMessage("Organizando seu feed...");

    // Organize feed order using AI
    try {
      const descriptions = updatedPhotos.map(
        (p) => `${p.analysis?.category || "photo"}: ${p.analysis?.description || "foto"} (qualidade: ${p.analysis?.quality || "boa"})`
      );

      const response = await fetch("/api/organize-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDescriptions: descriptions }),
      });

      if (response.ok) {
        const { order, reasoning, tips } = await response.json();

        // Reorder photos based on AI suggestion
        const reorderedPhotos = order
          .filter((idx: number) => idx < updatedPhotos.length)
          .map((originalIdx: number, newPos: number) => ({
            ...updatedPhotos[originalIdx],
            position: newPos,
            feedPosition: newPos,
          }));

        // Add any photos not in the order array
        const includedIndices = new Set(order);
        const remainingPhotos = updatedPhotos
          .filter((_, idx) => !includedIndices.has(idx))
          .map((p, idx) => ({ ...p, position: reorderedPhotos.length + idx }));

        const allPhotos = [...reorderedPhotos, ...remainingPhotos];

        // Calculate schedule dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const scheduleDates = calculateScheduleDates(allPhotos.length, startDate, "every2days");

        const photosWithDates = allPhotos.map((p, idx) => ({
          ...p,
          scheduledDate: scheduleDates[idx],
        }));

        setPhotos(photosWithDates);
        setAiSummary(
          `🌸 Pronto! Editei ${photosWithDates.length} fotos e organizei o calendário. ${reasoning} ${tips?.length ? "💡 " + tips.join(" • ") : ""}`
        );
      } else {
        // Keep original order with dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const scheduleDates = calculateScheduleDates(updatedPhotos.length, startDate, "every2days");
        const photosWithDates = updatedPhotos.map((p, idx) => ({
          ...p,
          scheduledDate: scheduleDates[idx],
        }));
        setPhotos(photosWithDates);
        setAiSummary(`🌸 Editei e organizei ${updatedPhotos.length} fotos automaticamente!`);
      }
    } catch (err) {
      console.error("Feed organization failed:", err);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const scheduleDates = calculateScheduleDates(updatedPhotos.length, startDate, "every2days");
      const photosWithDates = updatedPhotos.map((p, idx) => ({
        ...p,
        scheduledDate: scheduleDates[idx],
      }));
      setPhotos(photosWithDates);
      setAiSummary(`🌸 Editei e organizei ${updatedPhotos.length} fotos automaticamente!`);
    }

    setProcessingProgress(100);
    setProcessingMessage("Tudo pronto! 🎉");

    await new Promise((r) => setTimeout(r, 800));
    setViewMode("feed");
    setChatOpen(true);
  }, []);

  const handleApproveAll = useCallback(() => {
    setPhotos((prev) => prev.map((p) => ({ ...p, approved: true })));
    setViewMode("approved");
  }, []);

  const handleClearAll = useCallback(() => {
    clearStorage();
    setPhotos([]);
    setViewMode("upload");
    setAiSummary("");
    setChatOpen(false);
    setIgPanelOpen(false);
  }, []);

  const handlePhotoUpdate = useCallback((updatedPhoto: Photo) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
    );
    setSelectedPhoto(null);
  }, []);

  const handleReorder = useCallback((newPhotos: Photo[]) => {
    setPhotos(newPhotos);
  }, []);

  const handleChatAction = useCallback(
    (actions: Array<{ type: string; fromIndex?: number; toIndex?: number; photoIndex?: number; caption?: string; date?: string }>) => {
      setPhotos((prev) => {
        let updated = [...prev];

        for (const action of actions) {
          if (action.type === "reorder" && action.fromIndex !== undefined && action.toIndex !== undefined) {
            const item = updated.splice(action.fromIndex, 1)[0];
            updated.splice(action.toIndex, 0, item);
            updated = updated.map((p, i) => ({ ...p, position: i }));
          } else if (action.type === "editCaption" && action.photoIndex !== undefined) {
            updated[action.photoIndex] = {
              ...updated[action.photoIndex],
              caption: action.caption || updated[action.photoIndex].caption,
            };
          } else if (action.type === "deletePhoto" && action.photoIndex !== undefined) {
            updated.splice(action.photoIndex, 1);
            updated = updated.map((p, i) => ({ ...p, position: i }));
          } else if (action.type === "updateSchedule" && action.photoIndex !== undefined && action.date) {
            updated[action.photoIndex] = {
              ...updated[action.photoIndex],
              scheduledDate: new Date(action.date),
            };
          }
        }

        return updated;
      });
    },
    []
  );

  const approvedCount = photos.filter((p) => p.approved).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f0a14 0%, #140d20 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar
        photoCount={photos.length}
        approvedCount={approvedCount}
        viewMode={viewMode}
        onUploadMore={() => fileInputRef.current?.click()}
        onApproveAll={handleApproveAll}
        chatOpen={chatOpen}
        onToggleChat={() => { setChatOpen((o) => !o); if (!chatOpen) setIgPanelOpen(false); }}
        igPanelOpen={igPanelOpen}
        onToggleIG={photos.length > 0 ? () => { setIgPanelOpen((o) => !o); if (!igPanelOpen) setChatOpen(false); } : undefined}
        onClearAll={photos.length > 0 ? handleClearAll : undefined}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleFilesSelected(files);
        }}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Main content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            transition: "all 0.3s ease",
          }}
        >
          {viewMode === "upload" && (
            <UploadZone onFilesSelected={handleFilesSelected} />
          )}

          {viewMode === "processing" && (
            <ProcessingOverlay
              progress={processingProgress}
              message={processingMessage}
              photoCount={photos.length}
            />
          )}

          {(viewMode === "feed" || viewMode === "approved") && (
            <div style={{ padding: "1rem" }}>
              {/* AI Summary Banner */}
              {aiSummary && (
                <div className="slide-up" style={{
                  background: "linear-gradient(135deg, rgba(192,132,252,0.12), rgba(244,114,182,0.07))",
                  border: "1px solid rgba(192,132,252,0.25)",
                  borderRadius: "20px", padding: "14px 16px",
                  marginBottom: "1rem",
                  display: "flex", alignItems: "flex-start", gap: "10px",
                }}>
                  <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>🌸</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#e2d9f5", fontSize: "0.875rem", lineHeight: "1.6" }}>
                      {aiSummary}
                    </p>
                    <p style={{ color: "#4a3660", fontSize: "0.75rem", marginTop: "5px" }}>
                      Arraste pra reordenar • Clique pra editar • Fala com a Ami pra mudar qualquer coisa
                    </p>
                  </div>
                  <button onClick={() => setAiSummary("")} style={{
                    background: "none", border: "none",
                    color: "#4a3660", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0,
                  }}>✕</button>
                </div>
              )}

              {viewMode === "approved" && (
                <div className="slide-up" style={{
                  background: "linear-gradient(135deg, rgba(134,239,172,0.1), rgba(52,211,153,0.07))",
                  border: "1px solid rgba(134,239,172,0.25)",
                  borderRadius: "20px", padding: "18px 20px",
                  marginBottom: "1rem", textAlign: "center",
                }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>🎉</div>
                  <p style={{ color: "#86efac", fontSize: "1rem", fontWeight: "800" }}>
                    {approvedCount} posts aprovados e agendados!
                  </p>
                  <p style={{ color: "#4a3660", fontSize: "0.8rem", marginTop: "4px" }}>
                    Integre com o Instagram para publicar automaticamente.
                  </p>
                </div>
              )}

              <FeedGrid
                photos={photos}
                onReorder={handleReorder}
                onPhotoClick={setSelectedPhoto}
                onApprove={(photoId) => {
                  setPhotos((prev) =>
                    prev.map((p) =>
                      p.id === photoId ? { ...p, approved: !p.approved } : p
                    )
                  );
                }}
                onDelete={(photoId) => {
                  deleteImageFromDB(photoId);
                  setPhotos((prev) => prev.filter((p) => p.id !== photoId));
                }}
              />
            </div>
          )}
        </div>

        {/* Instagram panel */}
        {igPanelOpen && (viewMode === "feed" || viewMode === "approved") && (
          <div style={{
            width: "300px", flexShrink: 0,
            background: "#0d0918",
            borderLeft: "1px solid rgba(192,132,252,0.12)",
            overflowY: "auto",
          }}>
            <div style={{
              padding: "14px 16px 10px",
              borderBottom: "1px solid rgba(192,132,252,0.1)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: "800", fontSize: "0.9rem", color: "#f5f0ff" }}>
                Instagram
              </span>
              <button
                onClick={() => setIgPanelOpen(false)}
                style={{ background: "none", border: "none", color: "#4a3660", cursor: "pointer", fontSize: "1rem" }}
              >✕</button>
            </div>
            <InstagramPanel
              photos={photos}
              onPublished={(photoId) => {
                setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, approved: true } : p));
              }}
            />
          </div>
        )}

        {/* Chat sidebar */}
        {chatOpen && (viewMode === "feed" || viewMode === "approved") && (
          <ChatSidebar
            messages={chatMessages}
            onSendMessage={async (text) => {
              const userMsg: ChatMessage = {
                id: generateId(),
                role: "user",
                content: text,
                timestamp: new Date(),
              };
              setChatMessages((prev) => [...prev, userMsg]);

              const feedContext = `Feed com ${photos.length} fotos. Categorias: ${photos.map((p) => p.analysis?.category).join(", ")}. Próximo post: ${photos[0]?.scheduledDate ? formatScheduleDate(photos[0].scheduledDate) : "não definido"}.`;

              try {
                const response = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messages: [...chatMessages, userMsg].map((m) => ({
                      role: m.role,
                      content: m.content,
                    })),
                    feedContext,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  const aiMsg: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: result.message || "Feito! 💜",
                    timestamp: new Date(),
                  };
                  setChatMessages((prev) => [...prev, aiMsg]);

                  if (result.actions?.length > 0) {
                    handleChatAction(result.actions);
                  }
                }
              } catch (err) {
                console.error("Chat failed:", err);
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: generateId(),
                    role: "assistant",
                    content: "Ops, tive um probleminha. Tenta de novo? 😅",
                    timestamp: new Date(),
                  },
                ]);
              }
            }}
            onClose={() => setChatOpen(false)}
            quickActions={[
              { label: "🔀 Reorganiza", prompt: "Reorganize o feed de forma mais estratégica e visualmente harmoniosa" },
              { label: "✍️ Muda legendas", prompt: "Reescreva todas as legendas de forma mais criativa, pessoal e autêntica" },
              { label: "📅 Mais posts agora", prompt: "Coloque mais posts essa semana, distribua melhor" },
              { label: "💡 Me dá dicas", prompt: "Que dicas você tem pra melhorar meu feed e crescer no Instagram?" },
            ]}
          />
        )}
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onSave={handlePhotoUpdate}
        />
      )}
    </div>
  );
}
