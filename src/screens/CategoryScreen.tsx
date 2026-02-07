import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { getCategories, saveCategory, deleteCategory } from '../utils/storage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Category } from '../types';

interface CategoryScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Category'>;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS.primary as string);

  const loadCategories = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Masukkan nama kategori');
      return;
    }

    if (!newCategoryIcon.trim()) {
      Alert.alert('Error', 'Masukkan emoji icon untuk kategori');
      return;
    }

    try {
      await saveCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim(),
        color: newCategoryColor,
      });

      setNewCategoryName('');
      setNewCategoryIcon('');
      setNewCategoryColor(COLORS.primary as string);
      setShowAddForm(false);
      loadCategories();
      Alert.alert('Berhasil', 'Kategori baru berhasil ditambahkan');
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan kategori');
      console.error(error);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Tidak Bisa Dihapus', 'Kategori default tidak bisa dihapus');
      return;
    }

    Alert.alert(
      'Hapus Kategori',
      `Yakin ingin menghapus kategori "${category.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              loadCategories();
              Alert.alert('Berhasil', 'Kategori berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', (error as Error).message || 'Gagal menghapus kategori');
            }
          },
        },
      ]
    );
  };

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA',
    '#FCBAD3', '#A8D8EA', '#FFFFD2', '#FF9800', '#2196F3',
  ];

  return (
    <View style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Add Category Button */}
        {!showAddForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>➕ Tambah Kategori Baru</Text>
          </TouchableOpacity>
        )}

        {/* Add Category Form */}
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Kategori Baru</Text>
            
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Nama Kategori</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="Contoh: Olahraga"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholderTextColor={COLORS.textSecondary as string}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Icon (Emoji)</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="Contoh: ⚽"
                value={newCategoryIcon}
                onChangeText={setNewCategoryIcon}
                placeholderTextColor={COLORS.textSecondary as string}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Warna</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <Text style={styles.colorCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[globalStyles.buttonOutline, { flex: 1, marginRight: SPACING.xs }]}
                onPress={() => {
                  setShowAddForm(false);
                  setNewCategoryName('');
                  setNewCategoryIcon('');
                  setNewCategoryColor(COLORS.primary as string);
                }}
              >
                <Text style={globalStyles.buttonOutlineText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.buttonPrimary, { flex: 1, marginLeft: SPACING.xs }]}
                onPress={handleAddCategory}
              >
                <Text style={globalStyles.buttonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Categories List */}
        <Text style={styles.sectionTitle}>Semua Kategori</Text>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryType}>
                {category.isDefault ? '📌 Kategori Default' : '✨ Kategori Custom'}
              </Text>
            </View>
            {!category.isDefault && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(category)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary as string,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  addButtonText: {
    color: COLORS.textLight as string,
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  addForm: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.text as string,
  },
  colorCheckmark: {
    color: COLORS.textLight as string,
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
    marginBottom: 2,
  },
  categoryType: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: 24,
  },
});

export default CategoryScreen;
