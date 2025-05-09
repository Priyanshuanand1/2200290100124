import React, { useState } from 'react';
import { Container, AppBar, Toolbar, Typography, Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { StockChart } from './components/StockChart';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { api } from './services/api';
import { useStocks } from './hooks/useStocks';

function App() {
  const { stocks, loading, error, retry } = useStocks();
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const stocksMap = Object.fromEntries(stocks.map(stock => [stock.symbol, stock.symbol]));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={retry}>
          Retry Loading Data
        </button>
      </div>
    );
  }

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
            <InputLabel id="stock-select-label">Select Stocks</InputLabel>
            <Select
              labelId="stock-select-label"
              id="stock-select"
              multiple
              value={selectedStocks}
              onChange={handleStockChange}
              label="Select Stocks"
            >
              {Object.entries(stocksMap).map(([symbol, name]) => (
                <MenuItem key={symbol} value={symbol}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Stock Charts */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            {selectedStocks.map(symbol => (
              <Box key={symbol}>
                <StockChart symbol={symbol} stockName={symbol} />
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
