import { parentPort, workerData } from 'worker_threads';

// Data aggregation worker for large datasets
function performDataAggregation(data, options) {
  const { groupBy, aggregations, filters } = options;
  
  try {
    let filteredData = data;
    
    // Apply filters if provided
    if (filters && filters.length > 0) {
      filteredData = data.filter(row => {
        return filters.every(filter => {
          const value = row[filter.column];
          switch (filter.operator) {
            case 'equals':
              return value == filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater_than':
              return parseFloat(value) > parseFloat(filter.value);
            case 'less_than':
              return parseFloat(value) < parseFloat(filter.value);
            case 'between':
              return parseFloat(value) >= parseFloat(filter.min) && parseFloat(value) <= parseFloat(filter.max);
            default:
              return true;
          }
        });
      });
    }

    // Group data
    const groups = {};
    filteredData.forEach(row => {
      const key = groupBy ? row[groupBy] : 'all';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });

    // Perform aggregations
    const results = {};
    Object.keys(groups).forEach(groupKey => {
      const groupData = groups[groupKey];
      results[groupKey] = {
        count: groupData.length,
        percentage: ((groupData.length / filteredData.length) * 100).toFixed(2)
      };

      // Perform numerical aggregations
      aggregations.forEach(agg => {
        const { column, operations } = agg;
        const values = groupData
          .map(row => parseFloat(row[column]))
          .filter(val => !isNaN(val));

        if (values.length === 0) {
          results[groupKey][column] = null;
          return;
        }

        const aggResult = {};
        
        if (operations.includes('sum')) {
          aggResult.sum = values.reduce((sum, val) => sum + val, 0);
        }
        
        if (operations.includes('avg')) {
          aggResult.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
        
        if (operations.includes('min')) {
          aggResult.min = Math.min(...values);
        }
        
        if (operations.includes('max')) {
          aggResult.max = Math.max(...values);
        }
        
        if (operations.includes('count')) {
          aggResult.count = values.length;
        }

        if (operations.includes('median')) {
          const sorted = values.sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          aggResult.median = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
        }

        if (operations.includes('std')) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          aggResult.std = Math.sqrt(variance);
        }

        results[groupKey][column] = aggResult;
      });
    });

    // Calculate totals and overall statistics
    const overall = {
      totalRecords: data.length,
      filteredRecords: filteredData.length,
      groups: Object.keys(results).length,
      processingTime: Date.now() - workerData.startTime
    };

    parentPort.postMessage({
      success: true,
      results,
      overall,
      metadata: {
        groupBy,
        aggregations: aggregations.map(a => a.column),
        filtersApplied: filters ? filters.length : 0
      }
    });

  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

// Start processing
const { data, options } = workerData;
options.startTime = Date.now();
performDataAggregation(data, options);
