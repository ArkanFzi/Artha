import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { Category } from '../types';

interface CategoryPickerProps {
  visible: boolean;
  categories: Category[];
  selectedCategoryId?: string;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ visible, categories, selectedCategoryId, onSelect, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Pilih Kategori</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    { backgroundColor: item.color },
                    isSelected && styles.selectedCategory,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.textSecondary as string,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  grid: {
    paddingHorizontal: SPACING.md,
  },
  categoryItem: {
    flex: 1,
    aspectRatio: 1,
    margin: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: COLORS.text as string,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs as any,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.text as string,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.success as string,
    borderRadius: BORDER_RADIUS.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: COLORS.textLight as string,
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});

export default CategoryPicker;
