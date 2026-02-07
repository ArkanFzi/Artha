import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface PINKeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
}

const PINKeypad: React.FC<PINKeypadProps> = ({ onPress, onDelete }) => {
  const { theme, isDark } = useTheme();

  const handlePress = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(value);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete']
  ];

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, keyIndex) => {
            if (key === '') {
              return <View key={keyIndex} style={styles.emptyKey} />;
            }

            if (key === 'delete') {
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={[
                    styles.key,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }
                  ]}
                  onPress={handleDelete}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.keyText, { color: theme.text }]}>⌫</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={keyIndex}
                style={[
                  styles.key,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }
                ]}
                onPress={() => handlePress(key)}
                activeOpacity={0.6}
              >
                <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyKey: {
    width: 70,
    height: 70,
    marginHorizontal: 12,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
  },
});

export default PINKeypad;
