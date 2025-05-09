import axios from 'axios';

const BASE_URL = 'http://20.244.56.144/stock-api';

// Authentication configuration
const AUTH_CONFIG = {
  companyName: 'Stock Price App',
  clientID: 'ae0886c0-5113-4d49-9400-b7c65720871c',
  clientSecret: 'YjYxNjE4ZjItNGU2My00N2U0LWFjODAtYjg0NjhmYTk0YWFk',
  ownerName: 'Stock User',
  ownerEmail: 'stock@example.com'
};

// Headers configuration
const getHeaders = async () => {
  try {
    // Register first
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, AUTH_CONFIG);
    console.log('Register response:', registerResponse.data);

    // Get token
    const tokenResponse = await axios.post(`${BASE_URL}/auth/token`, {
      clientID: AUTH_CONFIG.clientID,
      clientSecret: AUTH_CONFIG.clientSecret
    });
    console.log('Token response:', tokenResponse.data);

    const token = tokenResponse.data?.token;
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }
};

// Sample stock data for testing
const SAMPLE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' }
];

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.maxRedirects = 5;
axios.defaults.validateStatus = (status) => status < 500; // Handle only 5xx errors as errors

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error) && (!error.response || error.response.status >= 500)) {
      await sleep(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
};

const handleAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('The request timed out. Please try again.');
    }
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const data = error.response.data;
      throw new Error(
        `Server error (${status}): ${data?.message || 'Unknown error'}`
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response received from server. Please try again.');
    }
  }
  // Generic error
  throw new Error('An unexpected error occurred. Please try again.');
};

export interface Stock {
  symbol: string;
  name: string;
  lastUpdatedAt: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface ApiService {
  getStocks(): Promise<{ [key: string]: string }>;
  getStockPriceHistory(ticker: string, minutes?: number): Promise<StockPrice[]>;
}

export const api: ApiService = {
  // Get all available stocks
  async getStocks(): Promise<{ [key: string]: string }> {
    return retryOperation(async () => {
      const urls = [
        `${BASE_URL}/stock/list`,
        `${BASE_URL}/stocks`
      ];

      for (const url of urls) {
        try {
          console.log('Trying URL:', url);
          const response = await axios.get(url, {
            timeout: 3000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          console.log('Response from', url, ':', response.data);
          
          if (response.data) {
            let stocksObject: { [key: string]: string } = {};
            
            if (Array.isArray(response.data)) {
              stocksObject = response.data.reduce((acc, stock) => {
                acc[stock.name || stock.symbol] = stock.symbol;
                return acc;
              }, {} as { [key: string]: string });
            } else if (response.data.stocks) {
              stocksObject = response.data.stocks;
            } else if (typeof response.data === 'object') {
              stocksObject = response.data;
            }

            if (Object.keys(stocksObject).length > 0) {
              console.log('Successfully got stocks from', url, ':', stocksObject);
              return stocksObject;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${url}:`, error);
        }
      }

      // If all URLs fail, use sample data
      console.log('All API endpoints failed, using sample data');
      return SAMPLE_STOCKS.reduce((acc, stock) => {
        acc[stock.name] = stock.symbol;
        return acc;
      }, {} as { [key: string]: string });
    });
  },

  // Get stock price history
  async getStockPriceHistory(ticker: string, minutes?: number): Promise<StockPrice[]> {
    return retryOperation(async () => {
      const urls = [
        minutes 
          ? `${BASE_URL}/stocks/${ticker}?minutes=${minutes}`
          : `${BASE_URL}/stocks/${ticker}`,
        minutes
          ? `${BASE_URL}/stock/${ticker}?minutes=${minutes}`
          : `${BASE_URL}/stock/${ticker}`
      ];

      for (const url of urls) {
        try {
          console.log('Trying URL for price history:', url);
          const response = await axios.get(url, {
            timeout: 3000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (response.data) {
            console.log('Got price history from', url, ':', response.data);
            if (Array.isArray(response.data)) return response.data;
            if (response.data.stock) return [response.data.stock];
            if (response.data.prices) return response.data.prices;
            if (typeof response.data === 'object') return [response.data];
          }
        } catch (error) {
          console.warn(`Failed to fetch price history from ${url}:`, error);
        }
      }

      // If all URLs fail, return sample data
      const now = new Date();
      return Array.from({ length: 10 }, (_, i) => ({
        symbol: ticker,
        price: 100 + Math.random() * 10,
        timestamp: new Date(now.getTime() - i * 60000).toISOString()
      }));
    });
  }
};
