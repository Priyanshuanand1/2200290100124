import React, { useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { api } from '../services/api';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorDisplay } from './ErrorDisplay';
import { useStockData } from '../hooks/useStockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockChartProps {
  symbol: string;
  stockName: string;
}

export const StockChart: React.FC<StockChartProps> = ({ symbol, stockName }) => {
  const [timeInterval, setTimeInterval] = useState<number>(30);

  const fetchStockData = useCallback((interval: number) => {
    return api.getStockPriceHistory(symbol, interval);
  }, [symbol]);

  const { data: priceData, isLoading, error, refetch } = useStockData(
    fetchStockData,
    symbol,
    timeInterval
  );

  const average = priceData.length > 0
    ? priceData.reduce((sum, item) => sum + item.price, 0) / priceData.length
    : 0;

  const chartData = {
    labels: priceData.map(item => 
      new Date(item.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'Stock Price',
        data: priceData.map(item => item.price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Average',
        data: Array(priceData.length).fill(average),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5]
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${stockName} (${symbol}) Price Chart`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const price = context.raw;
            const time = context.label;
            return `Price: $${price.toFixed(2)} at ${time}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)'
        }
      }
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
          <Typography variant="h6">
            {stockName} ({symbol})
          </Typography>
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
        <Box sx={{ height: 400 }}>
          {isLoading ? (
            <LoadingOverlay message="Fetching stock data..." />
          ) : (
            <Line options={options} data={chartData} />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Average Price: ${average.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
};
