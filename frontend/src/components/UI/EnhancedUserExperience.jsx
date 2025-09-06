// Enhanced User Experience Components
// Error handling, notifications, and user feedback systems

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Upload, FileText, AlertCircle, Lightbulb } from 'lucide-react';

// Error Boundary Component
export class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });
    
    // Log error for debugging
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ChartErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
          canRetry={this.state.retryCount < 3}
        />
      );
    }

    return this.props.children;
  }
}

// Chart Error Display Component
const ChartErrorDisplay = ({ error, onRetry, retryCount, canRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 m-4">
    <div className="flex items-start space-x-3">
      <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
          Chart Generation Failed
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error?.message || 'An unexpected error occurred while generating the chart.'}
        </p>
        
        <div className="space-y-3">
          <div className="text-sm text-red-600 dark:text-red-400">
            <strong>Suggestions:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Check that your data contains the required columns</li>
              <li>Ensure data types are compatible with the selected chart type</li>
              <li>Try a different chart type or configuration</li>
              <li>Verify that your data is properly formatted</li>
            </ul>
          </div>
          
          {canRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again {retryCount > 0 && `(${retryCount}/3)`}
            </button>
          )}
          
          {retryCount >= 3 && (
            <div className="text-sm text-red-600 dark:text-red-400">
              <strong>Still having issues?</strong> Try refreshing the page or contact support.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Data Validation Component
export const DataValidationAlert = ({ validationResult, onDismiss }) => {
  if (!validationResult || validationResult.isValid) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Data Validation Issues
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <div className="mb-2">{validationResult.error}</div>
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Chart Type Suggestions Component
export const ChartTypeSuggestions = ({ suggestions, onSelectSuggestion, currentType }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Suggested Chart Types for Your Data
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelectSuggestion(suggestion)}
                className={`
                  text-left p-3 rounded-lg border transition-colors
                  ${suggestion.type === currentType 
                    ? 'bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                  }
                `}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {suggestion.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {suggestion.subtitle}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Confidence: {suggestion.suitability}%
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// File Upload Feedback Component
export const FileUploadFeedback = ({ 
  isUploading, 
  uploadProgress, 
  uploadError, 
  validationResult, 
  onRetryUpload,
  onDismissError 
}) => {
  if (isUploading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin">
            <Upload className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Uploading and processing your file...
            </div>
            {uploadProgress !== undefined && (
              <div className="mt-2">
                <div className="bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {uploadProgress}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (uploadError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Upload Failed
              </h4>
              <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                {uploadError}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mb-3">
                <strong>Supported formats:</strong> Excel (.xlsx, .xls), CSV (.csv)
              </div>
              <button
                onClick={onRetryUpload}
                className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (validationResult && !validationResult.isValid) {
    return <DataValidationAlert validationResult={validationResult} />;
  }

  return null;
};

// Success Notification Component
export const SuccessNotification = ({ message, details, onDismiss, autoHide = true }) => {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              {message}
            </h4>
            {details && (
              <div className="text-sm text-green-700 dark:text-green-300">
                {details}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Performance Warning Component
export const PerformanceWarning = ({ dataSize, recommendations, onOptimize, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (dataSize < 1000) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
              Large Dataset Detected
            </h4>
            <div className="text-sm text-orange-700 dark:text-orange-300 mb-2">
              Your dataset contains {dataSize.toLocaleString()} rows. Charts will be optimized for performance.
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 underline"
            >
              {isExpanded ? 'Hide' : 'Show'} optimization details
            </button>
            
            {isExpanded && (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>Applied optimizations:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Smart data sampling to improve render performance</li>
                    <li>Virtual scrolling for table views</li>
                    <li>Progressive chart loading</li>
                    <li>Optimized memory usage</li>
                  </ul>
                </div>
                
                {recommendations && recommendations.length > 0 && (
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>Recommendations:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {onOptimize && (
                  <button
                    onClick={onOptimize}
                    className="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                  >
                    Apply Additional Optimizations
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-orange-500 hover:text-orange-700 dark:hover:text-orange-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Unsupported Data Warning Component
export const UnsupportedDataWarning = ({ issues, suggestions, onDismiss }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Data Format Issues Detected
            </h4>
            
            <div className="space-y-3">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Issues found:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
              
              {suggestions && suggestions.length > 0 && (
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Suggestions:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Notification Manager Hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove after timeout
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((message, details) => {
    addNotification({ type: 'success', message, details });
  }, [addNotification]);

  const showError = useCallback((message, details) => {
    addNotification({ type: 'error', message, details, autoHide: false });
  }, [addNotification]);

  const showWarning = useCallback((message, details) => {
    addNotification({ type: 'warning', message, details });
  }, [addNotification]);

  const showInfo = useCallback((message, details) => {
    addNotification({ type: 'info', message, details });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default {
  ChartErrorBoundary,
  DataValidationAlert,
  ChartTypeSuggestions,
  FileUploadFeedback,
  SuccessNotification,
  PerformanceWarning,
  UnsupportedDataWarning,
  useNotifications
};
