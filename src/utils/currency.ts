export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 16000 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 17500 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 12000 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 105 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 10500 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 3400 },
];

export const formatCurrency = (amount: number | string, currencyCode: string = 'IDR'): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currencyCode === 'IDR') {
    return `Rp ${numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }
  
  return `${currency.symbol} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : 'Rp';
};

export const convertToIDR = (amount: number, rate: number): number => {
  return Math.round(amount * rate);
};
