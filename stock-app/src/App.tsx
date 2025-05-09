import React, { useEffect, useState } from 'react';
import { Container, AppBar, Toolbar, Typography, Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { StockChart } from './components/StockChart';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { api } from './services/api';

function App() {
  const [stocks, setStocks] = useState<{ [key: string]: string }>({});
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchStocks = async () => {
      try {
        const stocksData = await api.getStocks();
        setStocks(stocksData);
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setError('Failed to fetch stocks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const handleStockChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedStocks(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Price Aggregator
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Stock Selection */}
          <FormControl sx={{ minWidth: 200 }}>
            {loading && <Typography>Loading stocks...</Typography>}
            {error && <Typography color="error">{error}</Typography>}
            <InputLabel id="stock-select-label">Select Stocks</InputLabel>
            <Select
              labelId="stock-select-label"
              id="stock-select"
              multiple
              value={selectedStocks}
              onChange={handleStockChange}
              label="Select Stocks"
            >
              {Object.entries(stocks || {}).map(([name, symbol]) => (
                <MenuItem key={symbol} value={symbol}>
                  {name} ({symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Stock Charts */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            {selectedStocks.map(symbol => (
              <Box key={symbol}>
                <StockChart symbol={symbol} stockName={Object.entries(stocks || {}).find(([_, s]) => s === symbol)?.[0] || symbol} />
              </Box>
            ))}
          </Box>

          {/* Correlation Heatmap */}
          <Box>
            <CorrelationHeatmap stocks={stocks} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
