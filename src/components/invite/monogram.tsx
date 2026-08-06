"use client";

interface MonogramProps {
  text: string;
  className?: string;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
}

export function Monogram({
  text,
  className = "",
  color = "#ffffff",
  fontFamily = "var(--font-cormorant)",
  fontWeight = 400,
  fontSize,
}: MonogramProps) {
  if (!text) return null;

  return (
    <div className={`text-center ${className}`}>
      <span
        className="italic"
        style={{
          fontFamily,
          color,
          fontWeight,
          fontSize: fontSize ?? "3rem",
          lineHeight: 1.1,
        }}
      >
        {text}
      </span>
    </div>
  );
}
