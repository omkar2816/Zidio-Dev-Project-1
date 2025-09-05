import { parentPort, workerData } from 'worker_threads';

// Statistical analysis worker for large datasets
function performStatisticalAnalysis(data, options) {
  const { columns, analysisType } = options;
  const results = {};

  try {
    for (const column of columns) {
      const values = data
        .map(row => parseFloat(row[column]))
        .filter(val => !isNaN(val));

      if (values.length === 0) {
        results[column] = null;
        continue;
      }

      // Calculate basic statistics
      const sorted = values.sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((acc, val) => acc + val, 0);
      const mean = sum / count;
      
      // Calculate variance and standard deviation
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1);
      const stdDev = Math.sqrt(variance);

      // Calculate quartiles
      const q1 = sorted[Math.floor(count * 0.25)];
      const median = sorted[Math.floor(count * 0.5)];
      const q3 = sorted[Math.floor(count * 0.75)];

      // Calculate skewness and kurtosis for comprehensive analysis
      let skewness = 0;
      let kurtosis = 0;

      if (stdDev > 0) {
        const thirdMoment = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / count;
        const fourthMoment = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / count;
        
        skewness = thirdMoment;
        kurtosis = fourthMoment - 3; // Excess kurtosis
      }

      results[column] = {
        count,
        mean: Number(mean.toFixed(4)),
        median: Number(median.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        variance: Number(variance.toFixed(4)),
        min: sorted[0],
        max: sorted[count - 1],
        q1: Number(q1.toFixed(4)),
        q3: Number(q3.toFixed(4)),
        range: sorted[count - 1] - sorted[0],
        skewness: Number(skewness.toFixed(4)),
        kurtosis: Number(kurtosis.toFixed(4)),
        percentiles: {
          p5: sorted[Math.floor(count * 0.05)],
          p10: sorted[Math.floor(count * 0.10)],
          p90: sorted[Math.floor(count * 0.90)],
          p95: sorted[Math.floor(count * 0.95)],
          p99: sorted[Math.floor(count * 0.99)]
        }
      };

      // Detect outliers using IQR method
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = values.filter(val => val < lowerBound || val > upperBound);
      
      results[column].outliers = {
        count: outliers.length,
        percentage: Number(((outliers.length / count) * 100).toFixed(2)),
        values: outliers.slice(0, 10) // Limit to first 10 outliers
      };
    }

    // Calculate correlations between numeric columns if requested
    if (analysisType === 'comprehensive' && columns.length > 1) {
      results.correlations = {};
      
      for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
          const col1 = columns[i];
          const col2 = columns[j];
          
          const pairs = data
            .map(row => [parseFloat(row[col1]), parseFloat(row[col2])])
            .filter(([x, y]) => !isNaN(x) && !isNaN(y));

          if (pairs.length < 2) continue;

          const n = pairs.length;
          const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
          const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
          const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
          const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
          const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);

          const numerator = n * sumXY - sumX * sumY;
          const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
          
          const correlation = denominator === 0 ? 0 : numerator / denominator;
          
          results.correlations[`${col1}_${col2}`] = {
            columns: [col1, col2],
            correlation: Number(correlation.toFixed(4)),
            strength: getCorrelationStrength(Math.abs(correlation)),
            sampleSize: n
          };
        }
      }
    }

    parentPort.postMessage({
      success: true,
      results,
      processingTime: Date.now() - workerData.startTime
    });

  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

function getCorrelationStrength(absCorr) {
  if (absCorr >= 0.7) return 'Strong';
  if (absCorr >= 0.3) return 'Moderate';
  if (absCorr >= 0.1) return 'Weak';
  return 'Very Weak';
}

// Start processing
const { data, options } = workerData;
options.startTime = Date.now();
performStatisticalAnalysis(data, options);
