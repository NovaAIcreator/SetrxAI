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
    const H = 150;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let x = 42;
    let y = 98;
    let vy = 0;
    let onGround = true;
    let speed = 4.4;
    let dist = 0;
    let alive = true;
    let score = 0;
    let spawn = 40;
    let raf = 0;
    const groundY = 118;
    const obstacles = [];

    function jump() {
      if (!alive) {
        alive = true;
        obstacles.length = 0;
        dist = 0;
        score = 0;
        speed = 4.4;
        y = 98;
        vy = 0;
        onGround = true;
        spawn = 40;
        return;
      }
      if (onGround) {
        vy = -10.2;
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

    function drawDino(px, py, running) {
      // body
      ctx.fillStyle = '#3d5c45';
      ctx.fillRect(px, py + 6, 22, 16);
      // head
      ctx.fillRect(px + 14, py - 2, 14, 12);
      // eye
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(px + 22, py + 1, 3, 3);
      // leg animation
      const leg = running && alive ? (Math.floor(dist / 6) % 2 === 0 ? 0 : 4) : 0;
      ctx.fillStyle = '#3d5c45';
      ctx.fillRect(px + 4, py + 20, 5, 8 + (leg ? 0 : 2));
      ctx.fillRect(px + 13, py + 20, 5, 8 + (leg ? 2 : 0));
      // arm
      ctx.fillRect(px + 8, py + 10, 8, 3);
    }

    function drawCactus(c) {
      ctx.fillStyle = '#1a1a1a';
      // main stem
      ctx.fillRect(c.x, groundY - c.h, c.w, c.h);
      // arms
      if (c.h > 28) {
        ctx.fillRect(c.x - 6, groundY - c.h + 8, 6, 4);
        ctx.fillRect(c.x - 6, groundY - c.h + 8, 3, 12);
        ctx.fillRect(c.x + c.w, groundY - c.h + 14, 6, 4);
        ctx.fillRect(c.x + c.w + 3, groundY - c.h + 14, 3, 10);
      }
    }

    function tick() {
      raf = requestAnimationFrame(tick);

      // sky
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(0, 0, W, H);

      // ground line
      ctx.strokeStyle = '#161616';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // ground dots
      ctx.fillStyle = '#c9c4b8';
      for (let i = 0; i < 12; i++) {
        const gx = ((i * 40 - (dist % 40)) + W) % W;
        ctx.fillRect(gx, groundY + 6, 3, 2);
      }

      if (!activeRef.current) {
        ctx.fillStyle = '#5c5a54';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Paused — image almost ready', 14, 28);
        drawDino(x, y, false);
        return;
      }

      if (alive) {
        vy += 0.58;
        y += vy;
        if (y >= 98) {
          y = 98;
          vy = 0;
          onGround = true;
        }

        spawn -= 1;
        if (spawn <= 0) {
          obstacles.push({
            x: W + 8,
            w: 10 + Math.random() * 8,
            h: 24 + Math.random() * 22,
          });
          spawn = 55 + Math.random() * 75;
        }

        for (const c of obstacles) c.x -= speed;
        while (obstacles.length && obstacles[0].x < -50) obstacles.shift();

        dist += speed;
        score = Math.floor(dist / 10);
        speed = 4.4 + dist / 1600;

        // collision
        for (const c of obstacles) {
          if (x + 24 > c.x && x + 4 < c.x + c.w && y + 26 > groundY - c.h) {
            alive = false;
          }
        }
      }

      for (const c of obstacles) drawCactus(c);
      drawDino(x, y, alive);

      ctx.fillStyle = '#161616';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SCORE ' + score, W - 100, 22);

      if (!alive) {
        ctx.fillStyle = '#161616';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('TAP / SPACE TO RETRY', 14, 22);
      } else {
        ctx.fillStyle = '#5c5a54';
        ctx.font = '11px system-ui, sans-serif';
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
      className="block mx-auto touch-none"
      style={{ width: 360, height: 150, maxWidth: '100%' }}
    />
  );
}
