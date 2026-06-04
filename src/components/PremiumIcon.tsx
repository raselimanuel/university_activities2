import React from 'react';

interface PremiumIconProps {
  icon: string;
  primaryColor: string;
  lightBgColor: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function PremiumIcon({ 
  icon, 
  primaryColor, 
  lightBgColor, 
  size = 44, 
  className = "",
  animate = true
}: PremiumIconProps) {
  const containerSize = size;
  // Increase icon glyph size from 0.48 to 0.56 for much better readability and balance
  const iconSize = Math.floor(size * 0.56);
  const rgb = hexToRgb(primaryColor);

  return (
    <div 
      className={`d-inline-flex align-items-center justify-content-center position-relative overflow-hidden ${animate ? 'hover-bounce' : ''} ${className}`}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        // Premium glassmorphic background using a soft radial/linear gradient of the primary color
        background: `linear-gradient(135deg, rgba(${rgb}, 0.15) 0%, rgba(${rgb}, 0.05) 100%)`,
        border: `1.5px solid rgba(${rgb}, 0.3)`,
        borderRadius: '12px',
        boxShadow: `inset 0 2px 3px rgba(255, 255, 255, 0.7), 0 8px 16px -4px rgba(${rgb}, 0.16)`,
      }}
    >
      {/* Dynamic glow effect background bubble */}
      <div 
        className="position-absolute"
        style={{
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: primaryColor,
          filter: 'blur(10px)',
          opacity: 0.25,
          top: '20%',
          left: '20%',
        }}
      ></div>

      {/* Icon Glyph with drop shadow */}
      <i 
        className={`bi ${icon} position-relative z-1`}
        style={{
          fontSize: `${iconSize}px`,
          color: primaryColor,
          filter: `drop-shadow(0 2px 4px rgba(${rgb}, 0.35))`
        }}
      ></i>
    </div>
  );
}

// Convert Hex to RGB format for rgba colors
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  // Handle shorthand e.g. "FFF"
  const expandHex = cleanHex.length === 3 
    ? cleanHex.split('').map(char => char + char).join('') 
    : cleanHex;
    
  const r = parseInt(expandHex.substring(0, 2), 16) || 0;
  const g = parseInt(expandHex.substring(2, 4), 16) || 0;
  const b = parseInt(expandHex.substring(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}
