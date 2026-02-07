import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { formatCurrency, formatDate } from './calculations';
import { Transaction, Category } from '../types';

// Export transactions to CSV
export const exportToCSV = async (
  transactions: Transaction[], 
  categories: Category[], 
  startDate?: string, 
  endDate?: string
): Promise<string | null> => {
  try {
    // Filter by date range if provided
    let filteredTransactions = transactions;
    if (startDate && endDate) {
      filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date || t.createdAt);
        return transDate >= new Date(startDate) && transDate <= new Date(endDate);
      });
    }

    if (filteredTransactions.length === 0) {
      Alert.alert('Info', 'Tidak ada transaksi untuk diekspor');
      return null;
    }

    // Create CSV header
    let csv = 'Tanggal,Deskripsi,Kategori,Tipe,Jumlah,Catatan\n';

    // Add data rows
    filteredTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const date = formatDate(transaction.date || transaction.createdAt);
      const description = `"${transaction.description || ''}"`;
      const categoryName = category ? category.name : 'Pemasukan';
      const type = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const amount = transaction.amount;
      const notes = `"${transaction.note || ''}"`;

      csv += `${date},${description},${categoryName},${type},${amount},${notes}\n`;
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Keuangan_${timestamp}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Data Keuangan',
        UTI: 'public.comma-separated-values-text',
      });
      return fileUri;
    } else {
      Alert.alert('Error', 'Sharing tidak tersedia di perangkat ini');
      return null;
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    Alert.alert('Error', 'Gagal mengekspor data ke CSV');
    return null;
  }
};

// Export transactions to simple text report (alternative to PDF)
export const exportToTextReport = async (
  transactions: Transaction[], 
  categories: Category[], 
  startDate?: string, 
  endDate?: string
): Promise<string | null> => {
  try {
    // Filter by date range if provided
    let filteredTransactions = transactions;
    if (startDate && endDate) {
      filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date || t.createdAt);
        return transDate >= new Date(startDate) && transDate <= new Date(endDate);
      });
    }

    if (filteredTransactions.length === 0) {
      Alert.alert('Info', 'Tidak ada transaksi untuk diekspor');
      return null;
    }

    // Calculate totals
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    // Create report
    let report = '═══════════════════════════════════════\n';
    report += '       LAPORAN KEUANGAN\n';
    report += '═══════════════════════════════════════\n\n';
    
    if (startDate && endDate) {
      report += `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n`;
    }

    report += '───────────────────────────────────────\n';
    report += 'RINGKASAN\n';
    report += '───────────────────────────────────────\n';
    report += `Total Pemasukan  : ${formatCurrency(totalIncome)}\n`;
    report += `Total Pengeluaran: ${formatCurrency(totalExpense)}\n`;
    report += `Saldo            : ${formatCurrency(balance)}\n`;
    report += `Jumlah Transaksi : ${filteredTransactions.length}\n\n`;

    report += '───────────────────────────────────────\n';
    report += 'DETAIL TRANSAKSI\n';
    report += '───────────────────────────────────────\n\n';

    // Sort by date
    const sorted = [...filteredTransactions].sort((a, b) => 
      new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );

    sorted.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const date = formatDate(transaction.date || transaction.createdAt);
      const type = transaction.type === 'income' ? 'MASUK' : 'KELUAR';
      const amount = formatCurrency(transaction.amount);
      
      report += `[${date}] ${type}\n`;
      report += `${transaction.description}\n`;
      report += `Kategori: ${category?.name || 'Pemasukan'}\n`;
      report += `Jumlah: ${amount}\n`;
      if (transaction.note) {
        report += `Catatan: ${transaction.note}\n`;
      }
      report += '\n';
    });

    report += '═══════════════════════════════════════\n';
    report += `Diekspor pada: ${formatDate(new Date().toISOString())}\n`;
    report += '═══════════════════════════════════════\n';

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Keuangan_${timestamp}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, report, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Laporan Keuangan',
      });
      return fileUri;
    } else {
      Alert.alert('Error', 'Sharing tidak tersedia di perangkat ini');
      return null;
    }
  } catch (error) {
    console.error('Error exporting to text report:', error);
    Alert.alert('Error', 'Gagal mengekspor laporan');
    return null;
  }
};

// Export summary report
export const exportSummaryReport = async (
  transactions: Transaction[], 
  categories: Category[]
): Promise<string | null> => {
  try {
    if (transactions.length === 0) {
      Alert.alert('Info', 'Tidak ada data untuk diekspor');
      return null;
    }

    // Group by month
    const monthlyData: Record<string, { income: number, expense: number, count: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, count: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
      monthlyData[monthKey].count++;
    });

    // Create summary
    let summary = '═══════════════════════════════════════\n';
    summary += '    RINGKASAN KEUANGAN BULANAN\n';
    summary += '═══════════════════════════════════════\n\n';

    Object.keys(monthlyData).sort().reverse().forEach(month => {
      const data = monthlyData[month];
      const balance = data.income - data.expense;
      
      summary += `${month}\n`;
      summary += `  Pemasukan : ${formatCurrency(data.income)}\n`;
      summary += `  Pengeluaran: ${formatCurrency(data.expense)}\n`;
      summary += `  Saldo     : ${formatCurrency(balance)}\n`;
      summary += `  Transaksi : ${data.count}\n\n`;
    });

    summary += '═══════════════════════════════════════\n';

    // Create filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Ringkasan_Bulanan_${timestamp}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write and share
    await FileSystem.writeAsStringAsync(fileUri, summary, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Ringkasan Bulanan',
      });
      return fileUri;
    } else {
      Alert.alert('Error', 'Sharing tidak tersedia di perangkat ini');
      return null;
    }
  } catch (error) {
    console.error('Error exporting summary:', error);
    Alert.alert('Error', 'Gagal mengekspor ringkasan');
    return null;
  }
};
