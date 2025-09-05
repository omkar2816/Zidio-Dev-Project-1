import { Transform } from 'stream';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chunked data processor for large datasets
class ChunkedDataProcessor {
  constructor(chunkSize = 1000) {
    this.chunkSize = chunkSize;
  }

  // Process data in chunks to avoid memory overflow
  async processInChunks(data, processor) {
    const results = [];
    const totalChunks = Math.ceil(data.length / this.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, data.length);
      const chunk = data.slice(start, end);
      
      try {
        const chunkResult = await processor(chunk, i, totalChunks);
        results.push(chunkResult);
        
        // Allow event loop to process other tasks
        if (i % 10 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  // Stream-based data processing for very large files
  createProcessingStream(transformer) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const result = transformer(chunk);
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      }
    });
  }
}

// Optimized statistical calculations for large datasets
class OptimizedStats {
  // Calculate statistics using single pass algorithm
  static calculateSinglePassStats(values) {
    if (!values || values.length === 0) {
      return { count: 0, mean: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
    }

    let count = 0;
    let sum = 0;
    let sumSquares = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const value of values) {
      if (typeof value === 'number' && !isNaN(value)) {
        count++;
        sum += value;
        sumSquares += value * value;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }

    if (count === 0) {
      return { count: 0, mean: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = sum / count;
    const variance = count > 1 ? (sumSquares - (sum * sum) / count) / (count - 1) : 0;
    const stdDev = Math.sqrt(variance);

    return { count, mean, variance, stdDev, min, max };
  }

  // Calculate percentiles efficiently
  static calculatePercentiles(values, percentiles = [25, 50, 75, 90, 95, 99]) {
    if (!values || values.length === 0) return {};

    const numericValues = values
      .filter(v => typeof v === 'number' && !isNaN(v))
      .sort((a, b) => a - b);

    if (numericValues.length === 0) return {};

    const result = {};
    for (const p of percentiles) {
      const index = (p / 100) * (numericValues.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      
      if (lower === upper) {
        result[`p${p}`] = numericValues[lower];
      } else {
        const weight = index - lower;
        result[`p${p}`] = numericValues[lower] * (1 - weight) + numericValues[upper] * weight;
      }
    }

    return result;
  }

  // Efficient correlation calculation using streaming algorithm
  static calculateStreamingCorrelation(dataStream, col1, col2) {
    let n = 0;
    let sumX = 0, sumY = 0, sumXY = 0;
    let sumX2 = 0, sumY2 = 0;

    return new Promise((resolve, reject) => {
      dataStream.on('data', (row) => {
        const x = parseFloat(row[col1]);
        const y = parseFloat(row[col2]);

        if (!isNaN(x) && !isNaN(y)) {
          n++;
          sumX += x;
          sumY += y;
          sumXY += x * y;
          sumX2 += x * x;
          sumY2 += y * y;
        }
      });

      dataStream.on('end', () => {
        if (n < 2) {
          resolve(0);
          return;
        }

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        resolve(denominator === 0 ? 0 : numerator / denominator);
      });

      dataStream.on('error', reject);
    });
  }
}

// Memory-efficient data sampler
class DataSampler {
  // Reservoir sampling for large datasets
  static reservoirSample(data, sampleSize) {
    if (data.length <= sampleSize) return [...data];

    const sample = data.slice(0, sampleSize);
    
    for (let i = sampleSize; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      if (randomIndex < sampleSize) {
        sample[randomIndex] = data[i];
      }
    }

    return sample;
  }

  // Stratified sampling to maintain data distribution
  static stratifiedSample(data, groupByColumn, sampleSize) {
    const groups = {};
    
    // Group data
    for (const row of data) {
      const key = row[groupByColumn];
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const groupKeys = Object.keys(groups);
    const samplesPerGroup = Math.ceil(sampleSize / groupKeys.length);
    
    let sample = [];
    for (const key of groupKeys) {
      const groupSample = this.reservoirSample(groups[key], samplesPerGroup);
      sample = sample.concat(groupSample);
    }

    // If we have too many samples, randomly reduce
    if (sample.length > sampleSize) {
      sample = this.reservoirSample(sample, sampleSize);
    }

    return sample;
  }
}

// Worker thread manager for CPU-intensive tasks
class WorkerManager {
  static async runInWorker(workerScript, data, options = {}) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'workers', workerScript), {
        workerData: { data, options }
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      // Set timeout for long-running operations
      const timeout = options.timeout || 30000; // 30 seconds default
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker operation timed out'));
      }, timeout);
    });
  }
}

// Data compression utilities
class DataCompressor {
  // Compress repetitive data using run-length encoding
  static compressData(data) {
    if (!Array.isArray(data)) return data;

    const compressed = [];
    let current = data[0];
    let count = 1;

    for (let i = 1; i < data.length; i++) {
      if (JSON.stringify(data[i]) === JSON.stringify(current)) {
        count++;
      } else {
        compressed.push({ value: current, count });
        current = data[i];
        count = 1;
      }
    }
    
    if (count > 0) {
      compressed.push({ value: current, count });
    }

    return compressed;
  }

  // Decompress run-length encoded data
  static decompressData(compressed) {
    if (!Array.isArray(compressed)) return compressed;

    const decompressed = [];
    for (const item of compressed) {
      if (item.count && item.value !== undefined) {
        for (let i = 0; i < item.count; i++) {
          decompressed.push(item.value);
        }
      } else {
        decompressed.push(item);
      }
    }

    return decompressed;
  }
}

// Progress tracking for long operations
class ProgressTracker {
  constructor(total, callback) {
    this.total = total;
    this.current = 0;
    this.callback = callback;
    this.lastReported = 0;
  }

  increment(amount = 1) {
    this.current += amount;
    const percentage = Math.floor((this.current / this.total) * 100);
    
    // Report progress every 5%
    if (percentage - this.lastReported >= 5) {
      this.lastReported = percentage;
      if (this.callback) {
        this.callback({
          current: this.current,
          total: this.total,
          percentage,
          estimated: this.estimateTimeRemaining()
        });
      }
    }
  }

  estimateTimeRemaining() {
    if (this.current === 0) return null;
    
    const elapsed = Date.now() - this.startTime;
    const rate = this.current / elapsed;
    const remaining = (this.total - this.current) / rate;
    
    return Math.round(remaining);
  }

  start() {
    this.startTime = Date.now();
  }

  finish() {
    if (this.callback) {
      this.callback({
        current: this.total,
        total: this.total,
        percentage: 100,
        completed: true
      });
    }
  }
}

export {
  ChunkedDataProcessor,
  OptimizedStats,
  DataSampler,
  WorkerManager,
  DataCompressor,
  ProgressTracker
};
