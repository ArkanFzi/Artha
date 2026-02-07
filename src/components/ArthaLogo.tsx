import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface ArthaLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

const ArthaLogo: React.FC<ArthaLogoProps> = ({ size = 64, style }) => {
  return (
    <Image 
      source={require('../../assets/icon.png')} 
      style={[{ width: size, height: size }, style]} 
      resizeMode="contain"
    />
  );
};

export default ArthaLogo;
