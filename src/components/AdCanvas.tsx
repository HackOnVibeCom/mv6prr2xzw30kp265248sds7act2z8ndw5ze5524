import { useEffect, useRef } from "react";
import type { AdBrief, AdPalette } from "@/lib/api";

/**
 * Renders the finished advertisement to a canvas and exports it as a PNG.
 *
 * The AI supplies the background artwork only; every word is drawn here as
 * real text. Image models cannot spell reliably, and an advert with a
 * misspelled headline is worthless — so the artwork and the copy are composed
 * as separate layers.
 *
 * Layout is computed from the canvas size rather than hard-coded, so the same
 * code produces a correct square, landscape or story ad.
 */

export interface AdCanvasProps {
  brief: AdBrief;
  palette: AdPalette;
  width: number;
  height: number;
  /** AI artwork. When null, a palette gradient is drawn instead. */
  imageDataUri: string | null;
  appName: string;
  /** Receives the rendered canvas so a parent can trigger a download. */
  onReady?: (canvas: HTMLCanvasElement) => void;
}

const FONT_STACK: Record<AdPalette["type"], string> = {
  playful: '"Space Grotesk", "Inter", system-ui, sans-serif',
  editorial: '"Space Grotesk", Georgia, serif',
  technical: '"JetBrains Mono", ui-monospace, monospace',
  bold: '"Space Grotesk", "Inter", system-ui, sans-serif',
};

/** Greedy word wrap against a pixel width. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Ellipsise if we ran out of room mid-sentence.
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]!;
    if (ctx.measureText(last).width > maxWidth) {
      let trimmed = last;
      while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = `${trimmed}…`;
    }
  }

  return lines;
}

/**
 * Fits the headline by shrinking the font until it occupies at most `maxLines`.
 * Guarantees the headline is never clipped, whatever the model wrote.
 */
function fitHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  maxLines: number,
  fontFamily: string,
): { lines: string[]; size: number } {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `700 ${size}px ${fontFamily}`;
    const lines = wrap(ctx, text, maxWidth, maxLines + 1);
    if (lines.length <= maxLines) return { lines, size };
    size -= Math.max(2, Math.round(size * 0.06));
  }
  ctx.font = `700 ${minSize}px ${fontFamily}`;
  return { lines: wrap(ctx, text, maxWidth, maxLines), size: minSize };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function AdCanvas({
  brief,
  palette,
  width,
  height,
  imageDataUri,
  appName,
  onReady,
}: AdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const font = FONT_STACK[palette.type] ?? FONT_STACK.bold;
    // Scale every dimension off the short edge so all three formats look
    // proportionally identical rather than stretched.
    const unit = Math.min(width, height);
    const pad = Math.round(unit * 0.08);
    const textWidth = width - pad * 2;

    function drawBackground(img?: HTMLImageElement) {
      if (img) {
        // Cover-fit: fill the frame without distorting the artwork.
        const scale = Math.max(width / img.width, height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx!.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      } else {
        // No artwork available — a clean palette gradient still reads as a
        // deliberate design rather than a broken image.
        const g = ctx!.createLinearGradient(0, 0, width, height);
        g.addColorStop(0, palette.ink.scrim);
        g.addColorStop(1, palette.ink.accent);
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, width, height);
      }
    }

    function drawScrim() {
      // A vertical scrim keeps the headline legible over any artwork. Without
      // it, a busy or light image makes the text unreadable.
      const g = ctx!.createLinearGradient(0, height, 0, height * 0.15);
      const base = palette.ink.scrim;
      const isLightInk = palette.ink.heading.toLowerCase() > "#888888";
      const shade = isLightInk ? "0,0,0" : hexToRgb(base);
      g.addColorStop(0, `rgba(${shade},0.92)`);
      g.addColorStop(0.55, `rgba(${shade},0.72)`);
      g.addColorStop(1, `rgba(${shade},0)`);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, width, height);
    }

    function drawText() {
      let y = height - pad;

      // ── CTA pill (bottom) ──
      const ctaSize = Math.round(unit * 0.038);
      ctx!.font = `600 ${ctaSize}px ${font}`;
      const ctaText = brief.cta.trim();
      if (ctaText) {
        const tw = ctx!.measureText(ctaText).width;
        const padX = ctaSize * 0.9;
        const padY = ctaSize * 0.62;
        const pillW = tw + padX * 2;
        const pillH = ctaSize + padY * 2;

        ctx!.fillStyle = palette.ink.accent;
        roundRect(ctx!, pad, y - pillH, pillW, pillH, pillH / 2);
        ctx!.fill();

        ctx!.fillStyle = pickContrast(palette.ink.accent);
        ctx!.textBaseline = "middle";
        ctx!.fillText(ctaText, pad + padX, y - pillH / 2 + 1);
        y -= pillH + unit * 0.045;
      }

      ctx!.textBaseline = "alphabetic";

      // ── Subhead ──
      const subSize = Math.round(unit * 0.036);
      ctx!.font = `400 ${subSize}px ${font}`;
      const subLines = wrap(ctx!, brief.subhead, textWidth, 2);
      for (let i = subLines.length - 1; i >= 0; i--) {
        ctx!.fillStyle = palette.ink.body;
        ctx!.fillText(subLines[i]!, pad, y);
        y -= subSize * 1.38;
      }
      y -= unit * 0.022;

      // ── Headline ──
      const { lines, size } = fitHeadline(
        ctx!,
        brief.headline,
        textWidth,
        Math.round(unit * 0.105),
        Math.round(unit * 0.055),
        3,
        font,
      );
      ctx!.font = `700 ${size}px ${font}`;
      for (let i = lines.length - 1; i >= 0; i--) {
        ctx!.fillStyle = palette.ink.heading;
        ctx!.fillText(lines[i]!, pad, y);
        y -= size * 1.14;
      }

      // ── Badge (above headline) ──
      const badge = brief.badge?.trim();
      if (badge) {
        const bSize = Math.round(unit * 0.03);
        ctx!.font = `600 ${bSize}px ${font}`;
        const tw = ctx!.measureText(badge).width;
        const bPadX = bSize * 0.75;
        const bPadY = bSize * 0.5;
        const bh = bSize + bPadY * 2;
        y -= unit * 0.025;

        ctx!.strokeStyle = palette.ink.accent;
        ctx!.lineWidth = Math.max(1.5, unit * 0.002);
        roundRect(ctx!, pad, y - bh, tw + bPadX * 2, bh, bh / 2);
        ctx!.stroke();

        ctx!.fillStyle = palette.ink.accent;
        ctx!.textBaseline = "middle";
        ctx!.fillText(badge, pad + bPadX, y - bh / 2 + 1);
        ctx!.textBaseline = "alphabetic";
      }

      // ── App name (top-left) ──
      const nameSize = Math.round(unit * 0.032);
      ctx!.font = `600 ${nameSize}px ${font}`;
      ctx!.fillStyle = palette.ink.heading;
      ctx!.globalAlpha = 0.9;
      ctx!.textBaseline = "top";
      ctx!.fillText(appName, pad, pad);
      ctx!.globalAlpha = 1;
      ctx!.textBaseline = "alphabetic";
    }

    function finish() {
      drawScrim();
      drawText();
      onReady?.(canvas!);
    }

    if (imageDataUri) {
      const img = new Image();
      img.onload = () => {
        drawBackground(img);
        finish();
      };
      img.onerror = () => {
        drawBackground();
        finish();
      };
      img.src = imageDataUri;
    } else {
      drawBackground();
      finish();
    }
  }, [brief, palette, width, height, imageDataUri, appName, onReady]);

  return (
    <canvas
      ref={canvasRef}
      className="h-auto w-full rounded-xl border shadow-sm"
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={`Advertisement: ${brief.headline}. ${brief.subhead}. ${brief.cta}`}
    />
  );
}

/* -------------------------------------------------------------- utilities */

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Black or white, whichever is readable on the given background. */
function pickContrast(hex: string): string {
  const [r, g, b] = hexToRgb(hex).split(",").map(Number) as [number, number, number];
  // Perceived luminance (ITU-R BT.601).
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
