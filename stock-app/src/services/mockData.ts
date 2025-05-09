import { StockData } from './stockApi';

const MOCK_STOCKS: StockData[] = [
  {
    symbol: 'AAPL',
    price: 150.25,
    change: 2.5,
    volume: 1500000
  },
  {
    symbol: 'GOOGL',
    price: 2750.80,
    change: -1.2,
    volume: 800000
  },
  {
    symbol: 'MSFT',
    price: 285.45,
    change: 1.8,
    volume: 1200000
  },
  {
    symbol: 'AMZN',
    price: 3400.65,
    change: -0.5,
    volume: 950000
  },
  {
    symbol: 'TSLA',
    price: 750.30,
    change: 3.2,
    volume: 2000000
  }
];

export const getMockStockData = (symbol: string): StockData => {
  const stock = MOCK_STOCKS.find(s => s.symbol === symbol);
  if (!stock) {
    throw new Error(`Stock not found: ${symbol}`);
  }
  
  // Add some random variation to make it look more realistic
  const variation = Math.random() * 2 - 1; // Random number between -1 and 1
  const newPrice = stock.price * (1 + variation * 0.01);
  const newChange = variation;
  const newVolume = Math.floor(stock.volume * (0.9 + Math.random() * 0.2));
  
  return {
    ...stock,
    price: Number(newPrice.toFixed(2)),
    change: Number(newChange.toFixed(2)),
    volume: newVolume
  };
};

export const getMockMarketOverview = (): StockData[] => {
  return MOCK_STOCKS.map(stock => getMockStockData(stock.symbol));
};
