export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 16000 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 17500 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 12000 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 105 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 10500 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 3400 },
];

export const formatCurrency = (amount, currencyCode = 'IDR') => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  if (currencyCode === 'IDR') {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }
  
  // For foreign currencies, use standard formatting
  return `${currency.symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : 'Rp';
};

export const convertToIDR = (amount, rate) => {
  return Math.round(amount * rate);
};
