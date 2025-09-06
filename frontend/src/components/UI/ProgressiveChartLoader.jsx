import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ProgressiveChartLoader = ({ 
  chartData, 
  onComplete, 
  onError,
  className = ""
}) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('preparing');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const stages = {
    preparing: 'Preparing data...',
    processing: 'Processing chart data...',
    rendering: 'Rendering chart...',
    complete: 'Chart ready!'
  };
  
  useEffect(() => {
    if (!chartData) return;
    
    // Create abort controller for this operation
    abortControllerRef.current = new AbortController();
    
    const processChart = async () => {
      try {
        // Stage 1: Data preparation (20%)
        setStage('preparing');
        setProgress(20);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        // Stage 2: Data processing (60%)
        setStage('processing');
        setProgress(60);
        
        // Simulate chunked processing for large datasets
        const dataSize = Array.isArray(chartData.data) ? chartData.data.length : 0;
        if (dataSize > 1000) {
          // Process in chunks for large datasets
          const chunkSize = 100;
          const totalChunks = Math.ceil(dataSize / chunkSize);
          
          for (let i = 0; i < totalChunks; i++) {
            if (abortControllerRef.current?.signal.aborted) return;
            
            const chunkProgress = 60 + (i / totalChunks) * 20;
            setProgress(chunkProgress);
            
            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        // Stage 3: Rendering (90%)
        setStage('rendering');
        setProgress(90);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        // Stage 4: Complete (100%)
        setStage('complete');
        setProgress(100);
        
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            onComplete?.(chartData);
          }
        }, 300);
        
      } catch (err) {
        console.error('Chart processing error:', err);
        setError(err.message);
        onError?.(err);
      }
    };
    
    processChart();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [chartData, onComplete, onError]);
  
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-700 dark:text-red-300 text-center font-medium">
          Chart processing failed
        </p>
        <p className="text-red-600 dark:text-red-400 text-sm text-center mt-1">
          {error}
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 ${className}`}>
      {/* Progress indicator */}
      <div className="w-24 h-24 relative mb-6">
        {stage === 'complete' ? (
          <CheckCircle className="w-24 h-24 text-green-500" />
        ) : (
          <>
            {/* Background circle */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-blue-200 dark:text-blue-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                className="text-blue-500"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
                  transition: 'stroke-dashoffset 0.3s ease'
                }}
              />
            </svg>
            
            {/* Loading spinner in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          </>
        )}
      </div>
      
      {/* Progress text */}
      <div className="text-center">
        <p className="text-blue-800 dark:text-blue-200 font-medium text-lg">
          {stages[stage]}
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
          {progress}% complete
        </p>
        
        {/* Data size info */}
        {chartData && (
          <p className="text-blue-500 dark:text-blue-500 text-xs mt-2">
            Processing {chartData.totalDataRows?.toLocaleString() || 'unknown'} data points
          </p>
        )}
      </div>
      
      {/* Performance tips */}
      {chartData?.performanceMode && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-yellow-800 dark:text-yellow-200 text-xs text-center">
            💡 Large dataset detected - using optimized rendering
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressiveChartLoader;
