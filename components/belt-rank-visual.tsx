import { useId } from "react";
import {
  adultBeltColors,
  kidBeltColors,
} from "@/lib/profile-display";

const BELT_FILL: Record<string, string> = {
  ...adultBeltColors,
  ...kidBeltColors,
};

/** Horizontal BJJ belt with tip bar and degree stripes (0–4). */
export function BeltRankVisual({
  belt,
  stripes,
  label,
  className = "",
  size = "md",
}: {
  belt: string;
  stripes: number;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const uid = useId().replace(/:/g, "");
  const fill = BELT_FILL[belt] || "#e4e3e8";
  const isLight = belt === "white" || belt === "yellow" || belt === "gray";
  const count = Math.max(0, Math.min(4, Math.round(stripes)));

  const height = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  const width = size === "sm" ? 112 : size === "lg" ? 168 : 140;
  const tipWidth = size === "sm" ? 36 : size === "lg" ? 52 : 44;
  const stripeW = size === "sm" ? 3 : 4;
  const stripeGap = size === "sm" ? 3 : 4;
  const sheenId = `belt-sheen-${uid}`;

  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      role="img"
      aria-label={
        label
          ? `${label}${count ? `, ${count}` : ""}`
          : `Belt ${belt}, ${count} stripes`
      }
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible drop-shadow-sm"
        aria-hidden
      >
        <defs>
          <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isLight ? 0.35 : 0.18} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={isLight ? 0.12 : 0.28} />
          </linearGradient>
        </defs>
        {/* Main belt body */}
        <rect
          x="0"
          y="0"
          width={width - tipWidth + 2}
          height={height}
          rx={height / 2}
          fill={fill}
          stroke={isLight ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.35)"}
          strokeWidth="1"
        />
        <rect
          x="0"
          y="0"
          width={width - tipWidth + 2}
          height={height}
          rx={height / 2}
          fill={`url(#${sheenId})`}
        />
        {/* Black tip (or white tip on black belt) */}
        <rect
          x={width - tipWidth}
          y="0"
          width={tipWidth}
          height={height}
          rx={3}
          fill={belt === "black" ? "#f5f5f5" : "#141318"}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1"
        />
        {/* Degree stripes */}
        {Array.from({ length: count }).map((_, index) => {
          const x =
            width -
            tipWidth +
            6 +
            index * (stripeW + stripeGap);
          return (
            <rect
              key={index}
              x={x}
              y={3}
              width={stripeW}
              height={height - 6}
              rx={1}
              fill={belt === "black" ? "#141318" : "#f8f8f8"}
            />
          );
        })}
      </svg>
      {label ? (
        <span className="text-[13px] font-medium text-[var(--ink)]/80">
          {label}
          {count > 0 ? ` · ${count}` : ""}
        </span>
      ) : null}
    </div>
  );
}
