/**
 * WebSocket Hook - 管理游戏实时连接和消息队列
 * WebSocket Hook for managing real-time game connection and message queuing
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface GameActionMessage extends WebSocketMessage {
  type: 'player_action';
  data: {
    sequence_number: number;
    action_type: string;
    session_id: string;
    player_name: string;
    player_role: string;
    target_name?: string;
    details: any;
    timestamp: string;
  };
}

export interface DebateTurnMessage extends WebSocketMessage {
  type: 'debate_turn';
  data: {
    sequence_number: number;
    player_name: string;
    dialogue: string;
    timestamp: string;
  };
}

export interface VoteCastMessage extends WebSocketMessage {
  type: 'vote_cast';
  data: {
    sequence_number: number;
    voter: string;
    target: string;
    timestamp: string;
  };
}

export interface NightActionMessage extends WebSocketMessage {
  type: 'night_action';
  data: {
    sequence_number: number;
    action_type: string;
    player_name: string;
    player_role: string;
    target_name?: string;
    details: any;
    timestamp: string;
  };
}

export interface PhaseChangeMessage extends WebSocketMessage {
  type: 'phase_change';
  data: {
    sequence_number: number;
    phase: string;
    round_number: number;
    timestamp: string;
  };
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface UseWebSocketOptions {
  sessionId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface QueuedMessage extends WebSocketMessage {
  receivedAt: number;
  processed: boolean;
}

export const useWebSocket = ({
  sessionId,
  onMessage,
  onConnectionChange,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    connecting: false,
    error: null,
  });

  const [messages, setMessages] = useState<QueuedMessage[]>([]);
  const [processedSequence, setProcessedSequence] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const messageQueueRef = useRef<Map<number, QueuedMessage>>(new Map());

  // 清理函数
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    messageQueueRef.current.clear();
  }, []);

  // 处理消息队列，按序列号顺序处理
  const processMessageQueue = useCallback(() => {
    const queue = messageQueueRef.current;
    let nextSequence = processedSequence + 1;

    while (queue.has(nextSequence)) {
      const message = queue.get(nextSequence)!;
      queue.delete(nextSequence);

      setMessages(prev => [...prev, { ...message, processed: true }]);
      setProcessedSequence(nextSequence);

      if (onMessage) {
        onMessage(message);
      }

      nextSequence++;
    }
  }, [processedSequence, onMessage]);

  // 处理接收到的消息
  const handleMessage = useCallback((data: string) => {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      const queuedMessage: QueuedMessage = {
        ...message,
        receivedAt: Date.now(),
        processed: false,
      };

      // 检查是否有序列号
      if ('sequence_number' in message.data) {
        const sequenceNumber = message.data.sequence_number;
        messageQueueRef.current.set(sequenceNumber, queuedMessage);
        processMessageQueue();
      } else {
        // 没有序列号的消息直接处理
        setMessages(prev => [...prev, { ...queuedMessage, processed: true }]);
        if (onMessage) {
          onMessage(queuedMessage);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      setStatus(prev => ({ ...prev, error: 'Failed to parse message' }));
    }
  }, [onMessage, processMessageQueue]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus(prev => ({ ...prev, connecting: true, error: null }));

    const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setStatus({ connected: true, connecting: false, error: null });
      reconnectAttemptsRef.current = 0;
      setProcessedSequence(0);
      messageQueueRef.current.clear();
      setMessages([]);

      if (onConnectionChange) {
        onConnectionChange({ connected: true, connecting: false, error: null });
      }
    };

    ws.onmessage = (event) => {
      handleMessage(event.data);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setStatus({ connected: false, connecting: false, error: null });
      wsRef.current = null;

      if (onConnectionChange) {
        onConnectionChange({ connected: false, connecting: false, error: null });
      }

      // 自动重连
      if (reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${reconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        setStatus(prev => ({ ...prev, error: 'Connection failed' }));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus(prev => ({ ...prev, error: 'Connection error' }));
    };
  }, [sessionId, reconnectAttempts, reconnectInterval, handleMessage, onConnectionChange]);

  // 发送消息
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, message not sent');
      return false;
    }
  }, []);

  // 手动重连
  const reconnect = useCallback(() => {
    cleanup();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [cleanup, connect]);

  // 断开连接
  const disconnect = useCallback(() => {
    cleanup();
    setStatus({ connected: false, connecting: false, error: null });
    reconnectAttemptsRef.current = 0;
  }, [cleanup]);

  // 获取特定类型的消息
  const getMessagesByType = useCallback((type: string) => {
    return messages.filter(msg => msg.type === type);
  }, [messages]);

  // 获取未处理的消息
  const getUnprocessedMessages = useCallback(() => {
    return messages.filter(msg => !msg.processed);
  }, [messages]);

  // 初始化连接
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return {
    status,
    messages,
    sendMessage,
    reconnect,
    disconnect,
    getMessagesByType,
    getUnprocessedMessages,
    processedSequence,
  };
};
