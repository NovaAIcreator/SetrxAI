import { useEffect, useRef } from "react";

export default function DinoGame({ active }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 360, H = 140;
    canvas.width = W;
    canvas.height = H;
    let x = 36, y = 92, vy = 0, onGround = true, speed = 4.2, dist = 0, alive = true, score = 0, spawn = 0, raf = 0;
    const cactus = [];

    function jump() {
      if (!alive) {
        alive = true; cactus.length = 0; dist = 0; score = 0; speed = 4.2; y = 92; vy = 0; onGround = true;
        return;
      }
      if (onGround) { vy = -9.4; onGround = false; }
    }
    function onKey(e) {
      if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); jump(); }
    }
    canvas.addEventListener("pointerdown", jump);
    window.addEventListener("keydown", onKey);

    function tick() {
      raf = requestAnimationFrame(tick);
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#161616";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 116);
      ctx.lineTo(W - 8, 116);
      ctx.stroke();
      if (!activeRef.current) {
        ctx.fillStyle = "#5c5a54";
        ctx.font = "12px sans-serif";
        ctx.fillText("Image ready — game paused", 16, 36);
        return;
      }
      if (alive) {
        vy += 0.55; y += vy;
        if (y >= 92) { y = 92; vy = 0; onGround = true; }
        spawn -= 1;
        if (spawn <= 0) {
          cactus.push({ x: W + 10, w: 12 + Math.random() * 10, h: 22 + Math.random() * 16 });
          spawn = 70 + Math.random() * 70;
        }
        for (const c of cactus) c.x -= speed;
        while (cactus.length && cactus[0].x < -40) cactus.shift();
        dist += speed;
        score = Math.floor(dist / 10);
        speed = 4.2 + dist / 1800;
        for (const c of cactus) {
          if (x + 18 > c.x && x < c.x + c.w && y + 22 > 116 - c.h) alive = false;
        }
      }
      ctx.fillStyle = "#3f5c4f";
      ctx.fillRect(x, y, 20, 24);
      ctx.fillStyle = "#161616";
      for (const c of cactus) ctx.fillRect(c.x, 116 - c.h, c.w, c.h);
      ctx.font = "12px monospace";
      ctx.fillText("SCORE " + score, W - 110, 22);
      if (!alive) ctx.fillText("TAP / SPACE TO RETRY", 16, 22);
      else { ctx.fillStyle = "#5c5a54"; ctx.fillText("Space / tap to jump", 16, 22); }
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", jump);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg">
      <canvas ref={canvasRef} className="block h-[140px] w-full touch-none" />
    </div>
  );
}
