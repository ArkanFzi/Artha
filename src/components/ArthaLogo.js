import React from 'react';
import { Image } from 'react-native';

const ArthaLogo = ({ size = 64, style }) => {
  return (
    <Image 
      source={require('../../assets/icon.png')} 
      style={[{ width: size, height: size }, style]} 
      resizeMode="contain"
    />
  );
};

export default ArthaLogo;
