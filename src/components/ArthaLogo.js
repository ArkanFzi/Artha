import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';


const ArthaLogo = ({ size = 64, color, style }) => {
  // Use default teal colors if no color provided
  const primaryColor = color || "#00D9A6";
  const darkColor = "#00897B";
  const accentColor = "#FFD700";

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Defs>
        <LinearGradient id="walletGradient" x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0" stopColor={primaryColor} stopOpacity="1" />
          <Stop offset="1" stopColor={darkColor} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0" stopColor={accentColor} stopOpacity="1" />
          <Stop offset="1" stopColor="#FFA000" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Abstract Modern Wallet Shape */}
      {/* Back card/layer */}
      <Rect 
        x="15" 
        y="25" 
        width="70" 
        height="50" 
        rx="8" 
        fill={primaryColor} 
        fillOpacity="0.4"
      />
      
      {/* Main Wallet Body - Modern rounded rect shape */}
      <Rect 
        x="10" 
        y="35" 
        width="80" 
        height="50" 
        rx="10" 
        fill="url(#walletGradient)" 
      />
      
      {/* Card detail sticking out slightly */}
      <Path 
        d="M20 35 L20 30 Q20 25 25 25 L50 25 L50 35 Z" 
        fill={accentColor} 
        fillOpacity="0.8"
      />
      
      {/* Flap / Curve design */}
      <Path 
        d="M10 55 C 10 55, 30 55, 40 65 L 90 65 L 90 45 Q 90 35 80 35 L 10 35 Z" 
        fill="white" 
        fillOpacity="0.1" 
      />

      {/* Gold Button/Clasp */}
      <Circle cx="75" cy="60" r="6" fill="url(#goldGradient)" />
      
      {/* Stitching or Detail Line */}
      <Rect x="15" y="75" width="40" height="2" rx="1" fill="white" fillOpacity="0.3" />
    </Svg>
  );
};

export default ArthaLogo;
