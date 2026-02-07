import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ArthaLogo from './ArthaLogo';
import { COLORS, FONT_WEIGHTS, FONT_SIZES, SPACING, SHADOWS } from '../styles/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const [loadingText, setLoadingText] = useState('Memuat aplikasi...');
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // 1. Staged Entry Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 2. Data Loading Stages
    const stages = [
      { duration: 400, text: 'Menghubungkan ke database...', percent: 30 },
      { duration: 400, text: 'sinkronisasi data...', percent: 70 },
      { duration: 300, text: 'Menyiapkan dashboard...', percent: 100 },
    ];

    let stageIndex = 0;

    const runLoadingStages = () => {
      if (stageIndex >= stages.length) {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            if (onFinish) onFinish();
          });
        }, 500);
        return;
      }

      const stage = stages[stageIndex];
      setLoadingText(stage.text);
      setPercentage(stage.percent);

      Animated.timing(progressAnim, {
        toValue: stage.percent / 100,
        duration: stage.duration,
        useNativeDriver: false,
      }).start(() => {
        stageIndex++;
        runLoadingStages();
      });
    };

    const timer = setTimeout(runLoadingStages, 600);
    return () => clearTimeout(timer);
  }, []);

  const progressLineWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Animated Logo Container */}
        <Animated.View style={[
          styles.logoWrapper, 
          { 
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          <View style={styles.logoInner}>
            <ArthaLogo size={80} />
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }]
          }
        ]}>
          <Text style={[styles.appName, { color: theme.text }]}>Artha</Text>
          <Text style={[styles.appTagline, { color: theme.textSecondary }]}>
            Kelola Kekayaan dengan Bijak
          </Text>
        </Animated.View>

        {/* Modern Loader */}
        <View style={styles.loaderContainer}>
          <Text style={[styles.loadingStatus, { color: theme.textMuted }]}>
            {loadingText}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Animated.View style={[styles.progressLine, { width: progressLineWidth, backgroundColor: theme.primary }]} />
          </View>
          <Text style={[styles.percentage, { color: theme.primary }]}>{percentage}%</Text>
        </View>
      </Animated.View>

      <Text style={[styles.footer, { color: theme.textMuted }]}>ARTHA FINANCE • SECURE & PRIVATE</Text>
    </View>
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
  },
  logoWrapper: {
    marginBottom: SPACING.xl,
    ...SHADOWS.premium,
  },
  logoInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 217, 166, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 166, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.black,
    letterSpacing: -1.5,
  },
  appTagline: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 4,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loaderContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingStatus: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: width * 0.6,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressLine: {
    height: '100%',
    borderRadius: 1.5,
  },
  percentage: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 2,
    opacity: 0.5,
  },
});

export default SplashScreen;
