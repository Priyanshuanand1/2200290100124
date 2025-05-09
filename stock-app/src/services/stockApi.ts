import { getAuthHeader } from './auth';
import { getMockStockData, getMockMarketOverview } from './mockData';

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    // Simulate API call delay
    await delay(500);
    await getAuthHeader(); // Still validate auth token
    
    return getMockStockData(symbol);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

export const fetchMarketOverview = async (): Promise<StockData[]> => {
  try {
    // Simulate API call delay
    await delay(800);
    await getAuthHeader(); // Still validate auth token
    
    return getMockMarketOverview();
  } catch (error) {
    console.error('Error fetching market overview:', error);
    throw error;
  }
};
