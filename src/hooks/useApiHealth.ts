import { useState, useEffect } from 'react';

interface ApiHealthStatus {
  isOnline: boolean;
  lastChecked: Date | null;
  error: string | null;
  responseTime: number | null;
}

export const useApiHealth = (intervalMs: number = 30000) => {
  const [status, setStatus] = useState<ApiHealthStatus>({
    isOnline: false,
    lastChecked: null,
    error: null,
    responseTime: null
  });

  const checkHealth = async () => {
    const startTime = Date.now();
    
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        setStatus({
          isOnline: true,
          lastChecked: new Date(),
          error: null,
          responseTime
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setStatus({
        isOnline: false,
        lastChecked: new Date(),
        error: errorMessage,
        responseTime
      });
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, intervalMs);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    ...status,
    checkHealth, // Allow manual health checks
    statusText: status.isOnline 
      ? `API Online (${status.responseTime}ms)` 
      : status.error 
        ? `API Offline: ${status.error}`
        : 'API Status Unknown'
  };
};