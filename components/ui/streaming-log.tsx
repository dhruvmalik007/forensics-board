import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StreamingLogProps {
  logs: string[];
  className?: string;
  maxHeight?: string;
  autoScroll?: boolean;
}

export function StreamingLog({ 
  logs, 
  className, 
  maxHeight = '300px',
  autoScroll = true
}: StreamingLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when logs update
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div 
      ref={logContainerRef}
      className={cn(
        'bg-gray-900 text-gray-300 font-mono text-sm p-4 rounded-md overflow-y-auto',
        className
      )}
      style={{ maxHeight }}
    >
      {logs.length === 0 ? (
        <div className="text-gray-500 italic">Waiting for logs...</div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className="py-1">
            <span className="text-gray-500 mr-2">&gt;</span>
            {formatLogMessage(log)}
          </div>
        ))
      )}
    </div>
  );
}

// Helper function to format log messages with basic syntax highlighting
function formatLogMessage(message: string) {
  // Highlight JSON objects
  if (message.startsWith('{') || message.startsWith('[')) {
    try {
      const json = JSON.parse(message);
      return (
        <pre className="whitespace-pre-wrap break-words">
          <span className="text-blue-400">{JSON.stringify(json, null, 2)}</span>
        </pre>
      );
    } catch (e) {
      // Not valid JSON, continue with other formatting
    }
  }

  // Highlight URLs
  if (message.match(/https?:\/\/[^\s]+/)) {
    return (
      <span>
        {message.split(/(\bhttps?:\/\/[^\s]+\b)/).map((part, i) => 
          part.match(/\bhttps?:\/\/[^\s]+\b/) ? 
            <span key={i} className="text-blue-400">{part}</span> : 
            <span key={i}>{part}</span>
        )}
      </span>
    );
  }

  // Highlight error messages
  if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
    return <span className="text-red-400">{message}</span>;
  }

  // Highlight success messages
  if (message.toLowerCase().includes('success') || message.toLowerCase().includes('completed')) {
    return <span className="text-green-400">{message}</span>;
  }

  // Default formatting
  return <span>{message}</span>;
} 