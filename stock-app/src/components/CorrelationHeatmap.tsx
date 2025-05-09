import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { api, StockPrice } from '../services/api';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorDisplay } from './ErrorDisplay';
import { useStockData } from '../hooks/useStockData';

import { StockData } from '../services/stockApi';

interface CorrelationHeatmapProps {
  stocks: StockData[];
}

interface CorrelationData {
  [key: string]: {
    [key: string]: number;
    mean: number;
    stdDev: number;
  };
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ stocks }) => {
  const [timeInterval, setTimeInterval] = useState<number>(30);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);

  const stockSymbols = useMemo(() => stocks.map(stock => stock.symbol), [stocks]);
  
  const fetchStockData = useCallback((interval: number) => {
    return api.getStockPriceHistory(stockSymbols[0], interval);
  }, [stockSymbols]);

  // We'll use the hook for one stock to track loading state
  const { isLoading, error, refetch } = useStockData(
    fetchStockData,
    stockSymbols[0],
    timeInterval
  );

  const [correlationData, setCorrelationData] = useState<CorrelationData>({});

  const calculateCorrelation = (stockA: StockPrice[], stockB: StockPrice[]) => {
    const n = Math.min(stockA.length, stockB.length);
    if (n < 2) return 0;

    const pricesA = stockA.slice(0, n).map(p => p.price);
    const pricesB = stockB.slice(0, n).map(p => p.price);

    const meanA = pricesA.reduce((a, b) => a + b, 0) / n;
    const meanB = pricesB.reduce((a, b) => a + b, 0) / n;

    const stdDevA = Math.sqrt(pricesA.reduce((sum, price) => sum + Math.pow(price - meanA, 2), 0) / (n - 1));
    const stdDevB = Math.sqrt(pricesB.reduce((sum, price) => sum + Math.pow(price - meanB, 2), 0) / (n - 1));

    const covariance = pricesA.reduce((sum, price, i) => 
      sum + ((price - meanA) * (pricesB[i] - meanB)), 0) / (n - 1);

    return covariance / (stdDevA * stdDevB);
  };

  const calculateCorrelations = useCallback(async () => {
    try {
      const stockData: { [key: string]: StockPrice[] } = {};
      const correlations: CorrelationData = {};

      // Fetch data for all stocks
      for (const symbol of stockSymbols) {
        try {
          stockData[symbol] = await api.getStockPriceHistory(symbol, timeInterval);
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return;
        }
      }

      // Calculate correlations and statistics
      for (const symbolA of stockSymbols) {
        correlations[symbolA] = {
          mean: stockData[symbolA].reduce((sum, price) => sum + price.price, 0) / stockData[symbolA].length,
          stdDev: Math.sqrt(
            stockData[symbolA].reduce((sum, price) => 
              sum + Math.pow(price.price - (stockData[symbolA].reduce((s, p) => s + p.price, 0) / stockData[symbolA].length), 2), 
            0) / (stockData[symbolA].length - 1)
          )
        };

        for (const symbolB of stockSymbols) {
          correlations[symbolA][symbolB] = calculateCorrelation(stockData[symbolA], stockData[symbolB]);
        }
      }

      setCorrelationData(correlations);
    } catch (error) {
      console.error('Error calculating correlations:', error);
    }
  }, [stockSymbols, timeInterval]);

  useEffect(() => {
    if (!isLoading && !error) {
      calculateCorrelations();
    }
  }, [calculateCorrelations, isLoading, error]);

  const getCorrelationColor = (correlation: number) => {
    // Color scale from red (negative correlation) to white (no correlation) to blue (positive correlation)
    const value = (correlation + 1) / 2; // Convert from [-1, 1] to [0, 1]
    if (value < 0.5) {
      // Red to White
      const intensity = Math.floor(255 * (value * 2));
      return `rgb(255, ${intensity}, ${intensity})`;
    } else {
      // White to Blue
      const intensity = Math.floor(255 * (2 - value * 2));
      return `rgb(${intensity}, ${intensity}, 255)`;
    }
  };

  if (error) {
    const errorMessage = error.includes('401') 
      ? 'Authentication failed. Please check your credentials.'
      : error.includes('403')
      ? 'Access denied. Please check your permissions.'
      : error;

    return (
      <Card>
        <CardContent>
          <ErrorDisplay message={errorMessage} onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Stock Correlation Heatmap</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Interval</InputLabel>
            <Select
              value={timeInterval}
              label="Time Interval"
              onChange={(e) => setTimeInterval(Number(e.target.value))}
            >
              <MenuItem value={15}>Last 15 min</MenuItem>
              <MenuItem value={30}>Last 30 min</MenuItem>
              <MenuItem value={60}>Last 1 hour</MenuItem>
              <MenuItem value={120}>Last 2 hours</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          {isLoading ? (
            <LoadingOverlay message="Calculating correlations..." />
          ) : (
          <Box sx={{ display: 'inline-block', minWidth: 'fit-content' }}>
            {/* Header row with stock symbols */}
            <Box sx={{ display: 'flex', ml: 8 }}>
              {stocks.map((stock) => (
                <Box
                  key={stock.symbol}
                  sx={{
                    width: 60,
                    p: 1,
                    textAlign: 'center',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'bottom left',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Typography variant="caption">{stock.symbol}</Typography>
                </Box>
              ))}
            </Box>

            {/* Heatmap grid */}
            {stocks.map((stockA) => (
              <Box
                key={stockA.symbol}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
                onMouseEnter={() => setHoveredStock(stockA.symbol)}
                onMouseLeave={() => setHoveredStock(null)}
              >
                <Box sx={{ width: 100, p: 1 }}>
                  <Typography variant="caption">{stockA.symbol}</Typography>
                </Box>
                {stocks.map((stockB) => {
                  const correlation = correlationData[stockA.symbol]?.[stockB.symbol] ?? 0;
                  return (
                    <Box
                      key={`${stockA.symbol}-${stockB.symbol}`}
                      sx={{
                        width: 60,
                        height: 60,
                        backgroundColor: getCorrelationColor(correlation),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography variant="caption">
                        {correlation.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
          )}
        </Box>

        {/* Statistics display */}
        {hoveredStock && correlationData[hoveredStock] && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'action.hover' }}>
            <Typography variant="body2">
              {stocks.find(s => s.symbol === hoveredStock)?.symbol} Statistics:
              Mean: ${correlationData[hoveredStock].mean.toFixed(2)} |
              Std Dev: ${correlationData[hoveredStock].stdDev.toFixed(2)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
