import { useState, useRef, useEffect } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 BACKEND URL — yahan apna URL daalo
//
// Local development me:
//   const BACKEND_URL = "http://localhost:5000/api/chat";
//
// Render/Railway pe deploy kiya hai to:
//   const BACKEND_URL = "https://your-app.onrender.com/api/chat";
//
// Vercel pe deploy kiya hai to:
//   const BACKEND_URL = "https://your-app.vercel.app/api/chat";
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BACKEND_URL = "http://localhost:5000/api/chat";

export default function ChatPage({ config }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: config.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertTopic = (text) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: config.mode,
          systemPrompt: config.systemPrompt,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      const reply = data.reply || data.message || "No response received.";
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Backend se connect nahi ho paya. Please apna server check karo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format code blocks in AI messages
  const formatText = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
        return (
          <pre key={i} style={styles.codeBlock}>
            <code>{code}</code>
          </pre>
        );
      }
      return (
        <span key={i}>
          {part.split("\n").map((line, j) => (
            <span key={j}>
              {line}
              {j < part.split("\n").length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    });
  };

  return (
    <div style={{ ...styles.page, background: config.colors.bg }}>
      {/* ── NAVBAR ── */}
      <nav style={{ ...styles.nav, background: config.colors.surface, borderColor: config.colors.border }}>
        <a href="/" style={{ ...styles.logo, background: `linear-gradient(135deg, ${config.colors.accent}, ${config.colors.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ⚡ SetrxAI
        </a>
        <div style={styles.navLinks}>
          {[
            { href: "/study", label: "📚 Study" },
            { href: "/coding", label: "💻 Coding" },
            { href: "/general", label: "🌐 General" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                ...styles.navLink,
                ...(config.mode === link.href.slice(1) ? { background: config.colors.accent, color: "#fff" } : {}),
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={styles.hero}>
        <div style={{ ...styles.badge, borderColor: config.colors.accent, color: config.colors.accent2, background: config.colors.accent + "22" }}>
          {config.badge}
        </div>
        <h1 style={styles.h1}>
          {config.heroTitle}{" "}
          <span style={{ background: `linear-gradient(135deg, ${config.colors.accent}, ${config.colors.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {config.heroHighlight}
          </span>
        </h1>
        <p style={styles.heroP}>{config.heroDesc}</p>
      </section>

      {/* ── TOPIC CHIPS ── */}
      <div style={styles.chips}>
        {config.topics.map((t, i) => (
          <button
            key={i}
            onClick={() => insertTopic(t.prompt)}
            style={{ ...styles.chip, borderColor: config.colors.border }}
            onMouseEnter={(e) => { e.target.style.borderColor = config.colors.accent; e.target.style.color = config.colors.accent2; }}
            onMouseLeave={(e) => { e.target.style.borderColor = config.colors.border; e.target.style.color = "#94a3b8"; }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CHAT MESSAGES ── */}
      <main style={styles.chatWrapper}>
        <div style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.msgRow, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ ...styles.avatar, background: msg.role === "ai" ? `linear-gradient(135deg, ${config.colors.accent}, ${config.colors.accent2})` : "linear-gradient(135deg, #6c63ff, #a78bfa)" }}>
                {msg.role === "ai" ? config.aiAvatar : "👤"}
              </div>
              <div style={{ ...styles.bubble, ...(msg.role === "user" ? { ...styles.userBubble, borderColor: config.colors.accent } : { ...styles.aiBubble, borderColor: config.colors.border }), background: msg.role === "user" ? config.colors.userBubble : config.colors.aiBubble }}>
                {formatText(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ ...styles.msgRow, flexDirection: "row" }}>
              <div style={{ ...styles.avatar, background: `linear-gradient(135deg, ${config.colors.accent}, ${config.colors.accent2})` }}>
                {config.aiAvatar}
              </div>
              <div style={{ ...styles.bubble, ...styles.aiBubble, borderColor: config.colors.border, background: config.colors.aiBubble }}>
                <div style={styles.dots}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} style={{ ...styles.dot, background: config.colors.accent, animationDelay: `${d * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── INPUT BAR ── */}
      <div style={{ ...styles.inputBar, background: `linear-gradient(to top, ${config.colors.bg} 60%, transparent)` }}>
        <div style={{ ...styles.inputInner, background: config.colors.surface, borderColor: config.colors.border }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            rows={1}
            style={styles.textarea}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{ ...styles.sendBtn, background: `linear-gradient(135deg, ${config.colors.accent}, ${config.colors.accent2})`, opacity: loading ? 0.6 : 1 }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* ── SEO SECTION ── */}
      <section style={{ ...styles.seoSection, borderColor: config.colors.border }}>
        <h2 style={{ ...styles.seoH2, color: config.colors.accent2 }}>{config.seo.heading}</h2>
        <p style={styles.seoP}>{config.seo.para}</p>
        <div style={styles.featureGrid}>
          {config.seo.features.map((f, i) => (
            <div key={i} style={{ ...styles.featureCard, background: config.colors.surface, borderColor: config.colors.border }}>
              <h3 style={styles.featureH3}>{f.title}</h3>
              <p style={styles.featureP}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <p>© 2025 SetrxAI — Free AI Assistant &nbsp;|&nbsp;
          <a href="/study" style={{ color: config.colors.accent2 }}>Study</a> ·{" "}
          <a href="/coding" style={{ color: config.colors.accent2 }}>Coding</a> ·{" "}
          <a href="/general" style={{ color: config.colors.accent2 }}>General</a>
        </p>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ── SHARED STYLES ──
const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" },
  nav: { padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid" },
  logo: { fontSize: "1.4rem", fontWeight: 800, textDecoration: "none" },
  navLinks: { display: "flex", gap: "8px" },
  navLink: { color: "#94a3b8", textDecoration: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.9rem", transition: "all 0.2s" },
  hero: { textAlign: "center", padding: "48px 24px 28px" },
  badge: { display: "inline-block", padding: "5px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, marginBottom: "16px", border: "1px solid" },
  h1: { fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, marginBottom: "12px", lineHeight: 1.2 },
  heroP: { color: "#94a3b8", maxWidth: "560px", margin: "0 auto 24px", lineHeight: 1.6 },
  chips: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", padding: "0 24px 24px", maxWidth: "860px", margin: "0 auto" },
  chip: { background: "#1f2335", border: "1px solid", color: "#94a3b8", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s" },
  chatWrapper: { flex: 1, maxWidth: "800px", width: "100%", margin: "0 auto", padding: "0 16px 130px" },
  chatBox: { display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" },
  msgRow: { display: "flex", gap: "12px", alignItems: "flex-start" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  bubble: { maxWidth: "75%", padding: "12px 16px", borderRadius: "16px", fontSize: "0.95rem", lineHeight: 1.65, border: "1px solid", wordBreak: "break-word" },
  aiBubble: { borderTopLeftRadius: "4px" },
  userBubble: { borderTopRightRadius: "4px", textAlign: "right" },
  codeBlock: { background: "#0d1117", border: "1px solid #30363d", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", overflowX: "auto", marginTop: "8px", fontFamily: "'Courier New', monospace", lineHeight: 1.5 },
  dots: { display: "flex", gap: "4px", alignItems: "center", height: "20px" },
  dot: { width: "7px", height: "7px", borderRadius: "50%", display: "inline-block", animation: "bounce 1.2s infinite" },
  inputBar: { position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px" },
  inputInner: { maxWidth: "800px", margin: "0 auto", display: "flex", gap: "10px", border: "1px solid", borderRadius: "14px", padding: "10px 14px", alignItems: "flex-end" },
  textarea: { flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: "0.95rem", resize: "none", maxHeight: "120px", minHeight: "24px", fontFamily: "inherit", lineHeight: 1.5 },
  sendBtn: { border: "none", color: "white", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900 },
  seoSection: { maxWidth: "800px", margin: "0 auto", padding: "40px 16px", borderTop: "1px solid" },
  seoH2: { fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" },
  seoP: { color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "16px" },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" },
  featureCard: { border: "1px solid", borderRadius: "12px", padding: "16px" },
  featureH3: { fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" },
  featureP: { fontSize: "0.83rem", color: "#94a3b8", margin: 0 },
  footer: { textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "0.8rem", borderTop: "1px solid #1e293b" },
};
     
