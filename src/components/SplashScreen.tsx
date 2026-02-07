import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import ArthaLogo from './ArthaLogo';

interface SplashScreenProps {
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme, isDark } = useTheme();
  const [progress] = useState(new Animated.Value(0));
  const [loadingText, setLoadingText] = useState('Memuat aplikasi...');
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Simulate loading with stages
    const stages = [
      { duration: 300, text: 'Memuat aplikasi...', percent: 25 },
      { duration: 250, text: 'Memuat data...', percent: 60 },
      { duration: 250, text: 'Menyiapkan tampilan...', percent: 90 },
      { duration: 200, text: 'Hampir selesai...', percent: 100 },
    ];

    let stageIndex = 0;

    const runStage = () => {
      if (stageIndex >= stages.length) {
        // All stages complete, call onFinish
        setTimeout(() => {
          if (onFinish) {
            onFinish();
          }
        }, 200);
        return;
      }

      const stage = stages[stageIndex];
      setLoadingText(stage.text);
      setPercentage(stage.percent);

      Animated.timing(progress, {
        toValue: stage.percent / 100,
        duration: stage.duration,
        useNativeDriver: false,
      }).start(() => {
        stageIndex++;
        runStage();
      });
    };

    const timer = setTimeout(runStage, 300);
    return () => clearTimeout(timer);
  }, [onFinish, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={isDark ? ['#0A0E27', '#1A1F3A'] : ['#00BFA6', '#00897B']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: isDark ? theme.surface : 'rgba(255,255,255,0.2)' }]}>
            <ArthaLogo size={64} />
          </View>
          <Text style={[styles.appName, { color: isDark ? theme.text : '#FFFFFF' }]}>
            Artha
          </Text>
          <Text style={[styles.appTagline, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.8)' }]}>
            Kelola Kekayaan dengan Bijak
          </Text>
        </View>

        {/* Loading Progress */}
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.9)' }]}>
            {loadingText}
          </Text>
          
          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? theme.border : 'rgba(255,255,255,0.3)' }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth as any,
                  backgroundColor: isDark ? theme.primary : '#FFFFFF',
                },
              ]}
            />
          </View>

          {/* Percentage */}
          <Text style={[styles.percentage, { color: isDark ? theme.text : '#FFFFFF' }]}>
            {percentage}%
          </Text>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: isDark ? theme.textDisabled : 'rgba(255,255,255,0.6)' }]}>
          Version 1.0.0
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
  },
});

export default SplashScreen;
