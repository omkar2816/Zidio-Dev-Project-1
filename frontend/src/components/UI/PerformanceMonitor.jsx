import React, { useState, useEffect } from 'react';
import { Clock, Zap, Database, CheckCircle, AlertTriangle, Rocket } from 'lucide-react';

const PerformanceMonitor = ({ 
  responseTime, 
  dataSize, 
  performanceMode = false,
  className = "" 
}) => {
  const [displayTime, setDisplayTime] = useState(0);
  const [status, setStatus] = useState('good');

  useEffect(() => {
    // Animate the time counter
    if (responseTime) {
      const animationDuration = 1000; // 1 second
      const steps = 30;
      const increment = responseTime / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= responseTime) {
          current = responseTime;
          clearInterval(timer);
        }
        setDisplayTime(Math.round(current));
      }, animationDuration / steps);

      return () => clearInterval(timer);
    }
  }, [responseTime]);

  useEffect(() => {
    // Determine performance status
    if (responseTime < 500) {
      setStatus('excellent');
    } else if (responseTime < 1000) {
      setStatus('good');
    } else if (responseTime < 3000) {
      setStatus('fair');
    } else {
      setStatus('slow');
    }
  }, [responseTime]);

  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'slow': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'fair': return <AlertTriangle className="w-4 h-4" />;
      case 'slow': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'slow': return 'Slow';
      default: return 'Unknown';
    }
  };

  const getStatusBackground = () => {
    switch (status) {
      case 'excellent': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'good': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      case 'fair': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      case 'slow': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    }
  };

  if (!responseTime) return null;

  return (
    <div className={`rounded-lg border p-3 transition-all duration-300 ${getStatusBackground()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Status indicator */}
          <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          {/* Response time */}
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {displayTime}ms
            </span>
          </div>
          
          {/* Data size */}
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Database className="w-4 h-4" />
            <span className="text-sm">
              {dataSize?.toLocaleString()} rows
            </span>
          </div>
          
          {/* Performance mode indicator */}
          {performanceMode && (
            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Optimized</span>
            </div>
          )}
        </div>
        
        {/* Performance tips */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {status === 'slow' && 'Consider reducing data size'}
          {status === 'fair' && 'Good performance for dataset size'}
          {status === 'good' && 'Solid response time'}
          {status === 'excellent' && 'Lightning fast!'}
        </div>
      </div>
      
      {/* Progress bar for response time */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
              status === 'excellent' ? 'bg-green-500' :
              status === 'good' ? 'bg-blue-500' :
              status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ 
              width: `${Math.min((displayTime / 5000) * 100, 100)}%` // Scale to 5 seconds max
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0ms</span>
          <span>5s</span>
        </div>
      </div>
      
      {/* Performance breakdown */}
      {performanceMode && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1 mb-1">
              <Rocket className="w-3 h-3" /> Performance optimizations active:
            </div>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Smart data sampling enabled</li>
              <li>Virtual scrolling for large tables</li>
              <li>Optimized chart rendering</li>
              <li>Response compression active</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
