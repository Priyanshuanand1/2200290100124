import { useState, useEffect, useCallback } from 'react';
import { StockPrice } from '../services/api';

interface CacheItem {
  data: StockPrice[];
  timestamp: number;
  timeInterval: number;
}

const cache: { [key: string]: CacheItem } = {};
const CACHE_DURATION = 30000; // 30 seconds

export const useStockData = (
  fetchFunction: (timeInterval: number) => Promise<StockPrice[]>,
  symbol: string,
  timeInterval: number
) => {
  const [data, setData] = useState<StockPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = `${symbol}-${timeInterval}`;
    const now = Date.now();
    const cached = cache[cacheKey];

    // Check if we have valid cached data
    if (cached && 
        cached.timeInterval === timeInterval && 
        now - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFunction(timeInterval);
      setData(newData);
      
      // Update cache
      cache[cacheKey] = {
        data: newData,
        timestamp: now,
        timeInterval
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, symbol, timeInterval]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
