import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 2
      }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
      <Typography variant="body1" color="error" align="center">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" color="primary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Box>
  );
};
