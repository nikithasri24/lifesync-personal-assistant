import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  simulateConnection?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  connectionAttempts: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'wss://api.example.com/financial-data',
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    simulateConnection = true
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    connectionAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate market data for demo purposes
  const simulateMarketData = useCallback(() => {
    const marketDataTypes = [
      'price_update',
      'portfolio_update',
      'news_update',
      'alert_trigger',
      'market_status'
    ];

    const generateMessage = (): WebSocketMessage => {
      const type = marketDataTypes[Math.floor(Math.random() * marketDataTypes.length)];
      let payload;

      switch (type) {
        case 'price_update':
          payload = {
            symbol: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY'][Math.floor(Math.random() * 5)],
            price: 150 + Math.random() * 300,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 1000000)
          };
          break;
        
        case 'portfolio_update':
          payload = {
            totalValue: 50000 + Math.random() * 100000,
            dayChange: (Math.random() - 0.5) * 5000,
            positions: [
              {
                symbol: 'VTI',
                value: 25000 + Math.random() * 10000,
                change: (Math.random() - 0.5) * 1000
              }
            ]
          };
          break;
        
        case 'news_update':
          payload = {
            headline: 'Market Update: ' + new Date().toLocaleTimeString(),
            sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
            impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            symbols: ['AAPL', 'MSFT']
          };
          break;
        
        case 'alert_trigger':
          payload = {
            type: 'price_target',
            symbol: 'AAPL',
            message: 'Price target reached',
            threshold: 180
          };
          break;
        
        case 'market_status':
          payload = {
            status: 'open',
            nextClose: new Date(Date.now() + 6 * 60 * 60 * 1000),
            tradingVolume: Math.floor(Math.random() * 1000000000)
          };
          break;
        
        default:
          payload = {};
      }

      return {
        type,
        payload,
        timestamp: new Date()
      };
    };

    return generateMessage;
  }, []);

  const connect = useCallback(() => {
    if (state.isConnecting || state.isConnected) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    if (simulateConnection) {
      // Simulate connection delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionAttempts: 0
        }));
        
        onConnect?.();

        // Start sending simulated data
        const generateMessage = simulateMarketData();
        simulationIntervalRef.current = setInterval(() => {
          const message = generateMessage();
          setState(prev => ({ ...prev, lastMessage: message }));
          onMessage?.(message);
        }, 1000 + Math.random() * 4000); // Random interval between 1-5 seconds

      }, 500 + Math.random() * 1500); // Random connection delay
    } else {
      // Real WebSocket connection
      try {
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            connectionAttempts: 0,
            error: null
          }));
          onConnect?.();
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setState(prev => ({ ...prev, lastMessage: message }));
            onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
          onDisconnect?.();
          attemptReconnect();
        };

        wsRef.current.onerror = (error) => {
          setState(prev => ({
            ...prev,
            error: 'Connection failed',
            isConnecting: false
          }));
          onError?.(error);
        };
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to create WebSocket connection',
          isConnecting: false
        }));
      }
    }
  }, [state.isConnecting, state.isConnected, simulateConnection, url, onConnect, onMessage, onDisconnect, onError, simulateMarketData]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0
    }));
  }, []);

  const attemptReconnect = useCallback(() => {
    if (state.connectionAttempts >= maxReconnectAttempts) {
      setState(prev => ({
        ...prev,
        error: `Max reconnection attempts (${maxReconnectAttempts}) reached`
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      connectionAttempts: prev.connectionAttempts + 1
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [state.connectionAttempts, maxReconnectAttempts, reconnectInterval, connect]);

  const sendMessage = useCallback((message: any) => {
    if (!state.isConnected) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      if (simulateConnection) {
        // For simulation, just log the message
        console.log('Simulated WebSocket send:', message);
        return true;
      } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        return true;
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      setState(prev => ({ ...prev, error: 'Failed to send message' }));
    }

    return false;
  }, [state.isConnected, simulateConnection]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    reconnect: connect
  };
}

// Hook for financial data specifically
export function useFinancialDataWebSocket() {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'price_update':
        setMarketData(prev => {
          const updated = [...prev];
          const index = updated.findIndex(item => item.symbol === message.payload.symbol);
          if (index >= 0) {
            updated[index] = { ...updated[index], ...message.payload };
          } else {
            updated.push(message.payload);
          }
          return updated;
        });
        break;
      
      case 'portfolio_update':
        setPortfolioData(message.payload);
        break;
      
      case 'news_update':
        setNews(prev => [message.payload, ...prev.slice(0, 9)]); // Keep last 10 news items
        break;
      
      case 'alert_trigger':
        setAlerts(prev => [message.payload, ...prev.slice(0, 4)]); // Keep last 5 alerts
        break;
    }
  }, []);

  const webSocket = useWebSocket({
    onMessage: handleMessage,
    simulateConnection: true // Set to false for real WebSocket connection
  });

  return {
    ...webSocket,
    marketData,
    portfolioData,
    alerts,
    news,
    clearAlerts: () => setAlerts([]),
    clearNews: () => setNews([])
  };
}