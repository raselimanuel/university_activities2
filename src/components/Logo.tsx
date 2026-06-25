import React from 'react';

interface LogoProps {
  layout?: "horizontal" | "icon";
  theme?: "light" | "dark";
  height?: number | string;
  className?: string;
}

export default function Logo({ 
  layout = "horizontal", 
  theme = "light", 
  height = 40,
  className = "" 
}: LogoProps) {
  const textColor = theme === "dark" ? "#ffffff" : "#111827";
  const subtextColor = theme === "dark" ? "#9ca3af" : "#4b5563";
  const waveDarkColor = theme === "dark" ? "#6b7280" : "#4b5563";
  const brandRed = "#E31B23";

  // Calculate width ratio based on height for horizontal lockup
  // Standard lockup aspect ratio is approx 4:1 (width: 400, height: 100)
  const numericHeight = typeof height === "number" ? height : parseInt(height) || 40;
  const calculatedWidth = layout === "horizontal" ? numericHeight * 3.8 : numericHeight;

  return (
    <svg 
      viewBox={layout === "horizontal" ? "0 0 380 100" : "0 0 115 100"} 
      height={height} 
      width={calculatedWidth}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Logo Symbol (Icon Mark) */}
      <g transform="translate(0, 5)">
        {/* Left loop (E-like shape) */}
        <path 
          d="M 40 10 C 15 10, 5 25, 5 45 C 5 65, 15 80, 40 80 C 55 80, 65 72, 65 60 L 52 60 C 50 67, 45 70, 40 70 C 25 70, 17 58, 17 45 C 17 32, 25 20, 40 20 C 47 20, 52 25, 54 32 L 66 32 C 63 20, 52 10, 40 10 Z" 
          fill={brandRed} 
        />
        <rect x="17" y="40" width="28" height="10" rx="3" fill={brandRed} />

        {/* Right loop (O-like shape) */}
        <path 
          d="M 80 10 C 55 10, 45 25, 45 45 C 45 65, 55 80, 80 80 C 105 80, 115 65, 115 45 C 115 25, 105 10, 80 10 Z M 80 20 C 93 20, 103 30, 103 45 C 103 60, 93 70, 80 70 C 67 70, 57 60, 57 45 C 57 30, 67 20, 80 20 Z" 
          fill={brandRed} 
        />

        {/* Palm Tree inside the right loop */}
        {/* Stem */}
        <path d="M 80 65 Q 81 48, 87 35 L 85 35 Q 79 48, 78 65 Z" fill={brandRed} />
        {/* Leaves (Fronds) */}
        <path d="M 86 35 Q 70 34, 62 44 Q 72 38, 86 35 Z" fill={brandRed} />
        <path d="M 86 35 Q 75 22, 67 18 Q 78 24, 86 35 Z" fill={brandRed} />
        <path d="M 86 35 Q 89 18, 93 14 Q 91 25, 86 35 Z" fill={brandRed} />
        <path d="M 86 35 Q 102 24, 106 31 Q 95 31, 86 35 Z" fill={brandRed} />
        <path d="M 86 35 Q 101 39, 103 48 Q 93 42, 86 35 Z" fill={brandRed} />

        {/* Waves underneath */}
        <path d="M 10 75 Q 35 60, 60 78 T 110 70 L 110 74 Q 85 80, 60 74 T 10 79 Z" fill={waveDarkColor} opacity="0.8" />
        <path d="M 20 81 Q 45 68, 70 82 T 115 75 L 115 79 Q 90 85, 65 79 T 20 84 Z" fill={brandRed} />
      </g>

      {/* Brand Text Elements (Only for horizontal lockup) */}
      {layout === "horizontal" && (
        <g>
          <text 
            x="135" 
            y="42" 
            fontFamily="'Outfit', 'Inter', sans-serif" 
            fontWeight="800" 
            fontSize="28" 
            fill={textColor}
          >
            E-Organization
          </text>
          <text 
            x="135" 
            y="70" 
            fontFamily="'Outfit', 'Inter', sans-serif" 
            fontWeight="800" 
            fontSize="20" 
            fill={brandRed} 
            letterSpacing="8"
          >
            UNSRAT
          </text>
          <text 
            x="135" 
            y="88" 
            fontFamily="'Inter', sans-serif" 
            fontWeight="500" 
            fontSize="8.5" 
            fill={subtextColor} 
            letterSpacing="0.6"
          >
            Berkolaborasi • Berkarya • Berdampak
          </text>
        </g>
      )}
    </svg>
  );
}
