import React, { useRef, useEffect } from 'react';

interface MinimapProps {
  playerX: number;
  playerZ: number;
  playerAngle: number;
}

export const Minimap: React.FC<MinimapProps> = ({ playerX, playerZ, playerAngle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const center = w / 2;
    const radius = w / 2 - 4;
    const scale = radius / 36; // 36m world radius fits in minimap

    ctx.clearRect(0, 0, w, h);

    // Radar background
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Concentric range circles
    [0.33, 0.66, 1.0].forEach((rFrac) => {
      ctx.beginPath();
      ctx.arc(center, center, radius * rFrac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(center, 4);
    ctx.lineTo(center, h - 4);
    ctx.moveTo(4, center);
    ctx.lineTo(w - 4, center);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.stroke();

    // Player position
    const px = center + playerX * scale;
    const py = center + playerZ * scale;

    // Player icon (triangle pointing in facing direction)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerAngle);

    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-4, -5);
    ctx.lineTo(0, -3);
    ctx.lineTo(4, -5);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }, [playerX, playerZ, playerAngle]);

  return (
    <div
      id="minimap"
      data-hud
      className="relative select-none pointer-events-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="rounded-full shadow-lg border border-slate-700/50"
      />
      <div className="text-[9px] font-mono tracking-wider text-slate-400 text-center mt-1 uppercase pointer-events-none">
        Radar ({Math.round(playerX)}, {Math.round(playerZ)})
      </div>
    </div>
  );
};
