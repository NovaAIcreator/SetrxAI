import { useEffect, useRef } from 'react';

export default function DinoGame({ active = true }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 360;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let x = 44;
    let y = 104;
    let vy = 0;
    let onGround = true;
    let speed = 4.5;
    let dist = 0;
    let alive = true;
    let score = 0;
    let spawn = 50;
    let raf = 0;
    const groundY = 124;
    const obstacles = [];
    const clouds = [
      { x: 40, y: 28, s: 1 },
      { x: 160, y: 18, s: 0.8 },
      { x: 280, y: 34, s: 1.1 },
    ];

    function jump() {
      if (!alive) {
        alive = true;
        obstacles.length = 0;
        dist = 0;
        score = 0;
        speed = 4.5;
        y = 104;
        vy = 0;
        onGround = true;
        spawn = 50;
        return;
      }
      if (onGround) {
        vy = -10.5;
        onGround = false;
      }
    }

    function onKey(e) {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    }

    canvas.addEventListener('pointerdown', jump);
    window.addEventListener('keydown', onKey);

    function drawCloud(c) {
      ctx.fillStyle = 'rgba(22,22,22,0.12)';
      const s = c.s;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10 * s, 0, Math.PI * 2);
      ctx.arc(c.x + 12 * s, c.y - 4 * s, 12 * s, 0, Math.PI * 2);
      ctx.arc(c.x + 24 * s, c.y, 9 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawDino(px, py) {
      const legPhase = alive && onGround ? Math.floor(dist / 5) % 2 : 0;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(px + 12, groundY + 2, 14, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2f4a38';
      // leg back
      ctx.fillRect(px + 5, py + 22, 5, legPhase ? 10 : 7);
      // body
      ctx.fillRect(px + 2, py + 8, 20, 16);
      // tail
      ctx.fillRect(px - 6, py + 12, 8, 4);
      // head
      ctx.fillRect(px + 16, py, 16, 12);
      // snout
      ctx.fillRect(px + 28, py + 4, 6, 6);
      // eye
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(px + 26, py + 3, 3, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(px + 27, py + 4, 1.5, 1.5);
      // belly stripe
      ctx.fillStyle = '#3d6249';
      ctx.fillRect(px + 6, py + 14, 12, 6);
      // front leg
      ctx.fillStyle = '#2f4a38';
      ctx.fillRect(px + 14, py + 22, 5, legPhase ? 7 : 10);
      // arm
      ctx.fillRect(px + 10, py + 12, 7, 3);
    }

    function drawCactus(c) {
      const base = groundY - c.h;
      // texture stripes
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(c.x, base, c.w, c.h);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(c.x + 2, base + 4, 2, c.h - 8);
      if (c.h > 30) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(c.x - 7, base + 10, 7, 4);
        ctx.fillRect(c.x - 7, base + 10, 3, 14);
        ctx.fillRect(c.x + c.w, base + 16, 7, 4);
        ctx.fillRect(c.x + c.w + 4, base + 16, 3, 12);
      }
    }

    function tick() {
      raf = requestAnimationFrame(tick);

      // sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#ebe6dc');
      g.addColorStop(1, '#f4f1ea');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // clouds
      for (const c of clouds) {
        if (activeRef.current && alive) c.x -= 0.35 * c.s;
        if (c.x < -40) c.x = W + 20;
        drawCloud(c);
      }

      // ground band
      ctx.fillStyle = '#e0d9cc';
      ctx.fillRect(0, groundY, W, H - groundY);
      ctx.strokeStyle = '#161616';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // ground texture
      ctx.fillStyle = '#cfc6b6';
      for (let i = 0; i < 18; i++) {
        const gx = ((i * 28 - (dist * 0.8) % 28) + W) % W;
        ctx.fillRect(gx, groundY + 8 + (i % 3) * 4, 4, 2);
      }

      if (!activeRef.current) {
        ctx.fillStyle = '#5c5a54';
        ctx.font = '12px system-ui,sans-serif';
        ctx.fillText('Paused — finishing image…', 14, 26);
        drawDino(x, y);
        return;
      }

      if (alive) {
        vy += 0.6;
        y += vy;
        if (y >= 104) {
          y = 104;
          vy = 0;
          onGround = true;
        }
        spawn -= 1;
        if (spawn <= 0) {
          obstacles.push({
            x: W + 10,
            w: 11 + Math.random() * 7,
            h: 26 + Math.random() * 24,
          });
          spawn = 50 + Math.random() * 70;
        }
        for (const c of obstacles) c.x -= speed;
        while (obstacles.length && obstacles[0].x < -60) obstacles.shift();
        dist += speed;
        score = Math.floor(dist / 10);
        speed = 4.5 + dist / 1500;
        for (const c of obstacles) {
          if (x + 26 > c.x && x + 4 < c.x + c.w && y + 28 > groundY - c.h) alive = false;
        }
      }

      for (const c of obstacles) drawCactus(c);
      drawDino(x, y);

      ctx.fillStyle = '#161616';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SCORE ' + score, W - 98, 22);

      if (!alive) {
        ctx.fillStyle = '#161616';
        ctx.font = '12px system-ui,sans-serif';
        ctx.fillText('TAP / SPACE TO RETRY', 14, 22);
      } else {
        ctx.fillStyle = '#6b665c';
        ctx.font = '11px system-ui,sans-serif';
        ctx.fillText('Space / tap to jump', 14, 22);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', jump);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block mx-auto touch-none rounded-lg"
      style={{ width: 360, height: 160, maxWidth: '100%' }}
    />
  );
}
