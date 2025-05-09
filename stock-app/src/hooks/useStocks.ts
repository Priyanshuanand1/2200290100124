import { useState, useEffect, useCallback } from 'react';
import { StockData, fetchMarketOverview } from '../services/stockApi';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export const useStocks = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadStocks = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      const data = await fetchMarketOverview();
      setStocks(data);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error loading market data:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadStocks(true), RETRY_DELAY);
      } else {
        setError(`Failed to load market data after ${MAX_RETRIES} attempts`);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [retryCount]);

  // Function to manually retry loading
  const retry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    loadStocks();
    const interval = setInterval(() => loadStocks(), 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadStocks]);

  return { stocks, loading, error, retry };
};
