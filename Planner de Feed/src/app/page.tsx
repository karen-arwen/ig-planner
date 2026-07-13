"use client";

import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "📸", text: "Até 50 fotos de uma vez" },
  { icon: "🪄", text: "IA edita tudo sozinha" },
  { icon: "🎨", text: "Feed organizado e lindo" },
  { icon: "💅", text: "Você só dá ok" },
];

const STEPS = [
  { num: "01", icon: "🖼️", title: "Joga as fotos", desc: "Arrasta tudo de uma vez. Até 50." },
  { num: "02", icon: "✨", title: "A Ami trabalha", desc: "Edita, organiza e cria legendas." },
  { num: "03", icon: "💜", title: "Você aprova", desc: "Um clique e tá feito." },
];

export default function Home() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f0a14 0%, #1a0d2e 50%, #0f0a14 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)",
          top: "-100px", right: "-100px",
        }} />
        <div style={{
          position: "absolute", width: "350px", height: "350px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%)",
          bottom: "0", left: "-50px",
        }} />
        <div style={{
          position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)",
          top: "50%", left: "30%",
        }} />
      </div>

      {/* Logo */}
      <div className="slide-up" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div className="float" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "72px", height: "72px", borderRadius: "24px",
          background: "linear-gradient(135deg, #c084fc, #9333ea)",
          fontSize: "2.2rem", marginBottom: "1.2rem",
          boxShadow: "0 0 40px rgba(192,132,252,0.4)",
        }}>
          🌸
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
          fontWeight: "900",
          background: "linear-gradient(135deg, #f5f0ff 20%, #c084fc 60%, #f472b6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "-2px", lineHeight: 1, marginBottom: "1rem",
        }}>
          Postaí
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#9b84b8", maxWidth: "380px", lineHeight: "1.7" }}>
          Joga as fotos.<br />
          A IA edita, organiza e agenda.<br />
          <span style={{ color: "#c084fc", fontWeight: "600" }}>Você só dá ok. 💜</span>
        </p>
      </div>

      {/* Feature pills */}
      <div className="slide-up" style={{
        display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center",
        marginBottom: "2.5rem", maxWidth: "500px",
      }}>
        {FEATURES.map((f) => (
          <div key={f.text} style={{
            background: "rgba(192,132,252,0.1)",
            border: "1px solid rgba(192,132,252,0.25)",
            borderRadius: "100px", padding: "8px 16px",
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "0.85rem", color: "#d8b4fe",
          }}>
            <span>{f.icon}</span><span>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="slide-up" style={{
        display: "flex", gap: "12px", marginBottom: "2.5rem",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(192,132,252,0.15)",
            borderRadius: "20px", padding: "18px 20px",
            width: "150px", textAlign: "center",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #c084fc, #9333ea)",
              borderRadius: "100px", padding: "2px 10px",
              fontSize: "0.65rem", fontWeight: "800", color: "#fff", letterSpacing: "1px",
            }}>
              {s.num}
            </div>
            <div style={{ fontSize: "1.8rem", marginTop: "8px", marginBottom: "8px" }}>{s.icon}</div>
            <p style={{ fontWeight: "700", fontSize: "0.9rem", color: "#eee", marginBottom: "4px" }}>{s.title}</p>
            <p style={{ color: "#9b84b8", fontSize: "0.75rem", lineHeight: "1.4" }}>{s.desc}</p>
            {i < STEPS.length - 1 && (
              <div style={{
                position: "absolute", right: "-18px", top: "50%", transform: "translateY(-50%)",
                color: "#3d2a52", fontSize: "1rem", zIndex: 1,
              }}>→</div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/dashboard")}
        className="glow-pulse"
        style={{
          background: "linear-gradient(135deg, #c084fc, #9333ea)",
          color: "#fff", border: "none", borderRadius: "20px",
          padding: "18px 52px", fontSize: "1.1rem", fontWeight: "800",
          cursor: "pointer", letterSpacing: "0.3px",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        Começar agora ✨
      </button>

      <p style={{ marginTop: "1rem", color: "#4a3660", fontSize: "0.8rem" }}>
        Grátis • Sem cadastro • Funciona no celular também 📱
      </p>
    </main>
  );
}
