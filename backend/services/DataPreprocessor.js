import XLSX from 'xlsx';

class DataPreprocessor {
  constructor() {
    this.processingStats = {
      rowsProcessed: 0,
      missingValuesHandled: 0,
      duplicatesRemoved: 0,
      dataTypesNormalized: 0,
      outliersTreated: 0
    };
  }

  /**
   * Main preprocessing pipeline
   */
  async preprocessData(rawData, options = {}) {
    try {
      console.log('Starting data preprocessing...', { rows: rawData.length });
      
      let processedData = [...rawData];
      this.processingStats = {
        rowsProcessed: processedData.length,
        missingValuesHandled: 0,
        duplicatesRemoved: 0,
        dataTypesNormalized: 0,
        outliersTreated: 0
      };

      // Step 1: Clean and validate data
      processedData = this.cleanData(processedData);
      
      // Step 2: Handle missing values
      processedData = this.handleMissingValues(processedData, options.missingValueStrategy || 'auto');
      
      // Step 3: Remove duplicates
      processedData = this.removeDuplicates(processedData, options.duplicateStrategy || 'strict');
      
      // Step 4: Normalize data types
      processedData = this.normalizeDataTypes(processedData);
      
      // Step 5: Handle outliers (optional)
      if (options.handleOutliers) {
        processedData = this.handleOutliers(processedData, options.outlierStrategy || 'iqr');
      }
      
      // Step 6: Validate consistency
      const validationResult = this.validateDataConsistency(processedData);
      
      console.log('Data preprocessing completed:', this.processingStats);
      
      return {
        data: processedData,
        originalCount: rawData.length,
        processedCount: processedData.length,
        stats: this.processingStats,
        validation: validationResult,
        quality: this.calculateDataQuality(processedData)
      };
      
    } catch (error) {
      console.error('Data preprocessing error:', error);
      throw new Error(`Data preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Clean raw data - remove empty rows, invalid entries
   */
  cleanData(data) {
    return data.filter(row => {
      // Remove completely empty rows
      const values = Object.values(row);
      const hasContent = values.some(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        String(value).trim() !== ''
      );
      return hasContent;
    }).map(row => {
      // Clean individual cell values
      const cleanedRow = {};
      Object.keys(row).forEach(key => {
        let value = row[key];
        
        // Handle string values
        if (typeof value === 'string') {
          value = value.trim();
          // Convert common text representations of null/empty
          if (['null', 'NULL', 'n/a', 'N/A', 'undefined', '#N/A', ''].includes(value)) {
            value = null;
          }
        }
        
        cleanedRow[key] = value;
      });
      return cleanedRow;
    });
  }

  /**
   * Handle missing values with different strategies
   */
  handleMissingValues(data, strategy = 'auto') {
    const columns = Object.keys(data[0] || {});
    const columnStats = this.analyzeColumns(data);
    
    return data.map(row => {
      const processedRow = { ...row };
      
      columns.forEach(column => {
        if (row[column] === null || row[column] === undefined || row[column] === '') {
          this.processingStats.missingValuesHandled++;
          
          const columnType = columnStats[column].type;
          const columnData = columnStats[column];
          
          switch (strategy) {
            case 'mean':
              if (columnType === 'numeric') {
                processedRow[column] = columnData.mean || 0;
              } else {
                processedRow[column] = columnData.mode || 'Unknown';
              }
              break;
              
            case 'median':
              if (columnType === 'numeric') {
                processedRow[column] = columnData.median || 0;
              } else {
                processedRow[column] = columnData.mode || 'Unknown';
              }
              break;
              
            case 'mode':
              processedRow[column] = columnData.mode || (columnType === 'numeric' ? 0 : 'Unknown');
              break;
              
            case 'interpolate':
              if (columnType === 'numeric') {
                // Simple linear interpolation (could be enhanced)
                processedRow[column] = columnData.mean || 0;
              } else {
                processedRow[column] = columnData.mode || 'Unknown';
              }
              break;
              
            case 'auto':
            default:
              // Auto-select best strategy based on data type and distribution
              if (columnType === 'numeric') {
                // Use median for numeric data (robust to outliers)
                processedRow[column] = columnData.median || 0;
              } else {
                // Use mode for categorical data
                processedRow[column] = columnData.mode || 'Unknown';
              }
              break;
          }
        }
      });
      
      return processedRow;
    });
  }

  /**
   * Remove duplicate rows
   */
  removeDuplicates(data, strategy = 'strict') {
    const seen = new Set();
    const result = [];
    
    for (const row of data) {
      let key;
      
      switch (strategy) {
        case 'strict':
          // Exact match on all columns
          key = JSON.stringify(row);
          break;
          
        case 'key_columns':
          // Match on specific key columns (could be enhanced to detect key columns)
          const keyColumns = this.detectKeyColumns(data);
          const keyValues = keyColumns.map(col => row[col]);
          key = JSON.stringify(keyValues);
          break;
          
        case 'fuzzy':
          // Fuzzy matching (simplified version)
          key = this.createFuzzyKey(row);
          break;
          
        default:
          key = JSON.stringify(row);
      }
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      } else {
        this.processingStats.duplicatesRemoved++;
      }
    }
    
    return result;
  }

  /**
   * Normalize data types
   */
  normalizeDataTypes(data) {
    const columns = Object.keys(data[0] || {});
    const columnTypes = this.detectColumnTypes(data);
    
    return data.map(row => {
      const normalizedRow = {};
      
      columns.forEach(column => {
        let value = row[column];
        const detectedType = columnTypes[column];
        
        try {
          switch (detectedType) {
            case 'numeric':
              if (value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(String(value).replace(/[,$%]/g, ''));
                normalizedRow[column] = isNaN(numValue) ? 0 : numValue;
                this.processingStats.dataTypesNormalized++;
              } else {
                normalizedRow[column] = 0;
              }
              break;
              
            case 'date':
              if (value !== null && value !== undefined && value !== '') {
                const dateValue = this.parseDate(value);
                normalizedRow[column] = dateValue || value;
                if (dateValue) this.processingStats.dataTypesNormalized++;
              } else {
                normalizedRow[column] = value;
              }
              break;
              
            case 'boolean':
              if (value !== null && value !== undefined && value !== '') {
                normalizedRow[column] = this.parseBoolean(value);
                this.processingStats.dataTypesNormalized++;
              } else {
                normalizedRow[column] = false;
              }
              break;
              
            case 'categorical':
            case 'text':
            default:
              normalizedRow[column] = value === null || value === undefined ? '' : String(value);
              break;
          }
        } catch (error) {
          // If conversion fails, keep original value
          normalizedRow[column] = value;
        }
      });
      
      return normalizedRow;
    });
  }

  /**
   * Handle outliers using different strategies
   */
  handleOutliers(data, strategy = 'iqr') {
    const numericColumns = this.detectNumericColumns(data);
    const outlierBounds = {};
    
    // Calculate outlier bounds for each numeric column
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      outlierBounds[column] = this.calculateOutlierBounds(values, strategy);
    });
    
    return data.map(row => {
      const processedRow = { ...row };
      
      numericColumns.forEach(column => {
        const value = parseFloat(row[column]);
        if (!isNaN(value) && outlierBounds[column]) {
          const { lower, upper } = outlierBounds[column];
          
          if (value < lower || value > upper) {
            this.processingStats.outliersTreated++;
            
            switch (strategy) {
              case 'cap':
                // Cap at bounds
                processedRow[column] = value < lower ? lower : upper;
                break;
                
              case 'remove':
                // Mark for removal (handled in filter step)
                processedRow._outlier = true;
                break;
                
              case 'iqr':
              default:
                // Cap at IQR bounds
                processedRow[column] = value < lower ? lower : upper;
                break;
            }
          }
        }
      });
      
      return processedRow;
    }).filter(row => !row._outlier); // Remove outliers if strategy is 'remove'
  }

  /**
   * Analyze columns to get statistics
   */
  analyzeColumns(data) {
    const columns = Object.keys(data[0] || {});
    const stats = {};
    
    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      stats[column] = {
        type: this.detectColumnType(values),
        totalCount: data.length,
        nonNullCount: values.length,
        nullCount: data.length - values.length,
        uniqueCount: new Set(values).size,
        mean: numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : null,
        median: numericValues.length > 0 ? this.calculateMedian(numericValues) : null,
        mode: this.calculateMode(values),
        min: numericValues.length > 0 ? Math.min(...numericValues) : null,
        max: numericValues.length > 0 ? Math.max(...numericValues) : null
      };
    });
    
    return stats;
  }

  /**
   * Detect column types
   */
  detectColumnTypes(data) {
    const columns = Object.keys(data[0] || {});
    const types = {};
    
    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
      types[column] = this.detectColumnType(values);
    });
    
    return types;
  }

  detectColumnType(values) {
    if (values.length === 0) return 'text';
    
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check if numeric
    const numericCount = sample.filter(v => !isNaN(parseFloat(v))).length;
    if (numericCount / sample.length > 0.8) return 'numeric';
    
    // Check if date
    const dateCount = sample.filter(v => this.parseDate(v) !== null).length;
    if (dateCount / sample.length > 0.8) return 'date';
    
    // Check if boolean
    const booleanCount = sample.filter(v => this.parseBoolean(v) !== null).length;
    if (booleanCount / sample.length > 0.8) return 'boolean';
    
    // Check if categorical (limited unique values)
    const uniqueRatio = new Set(sample).size / sample.length;
    if (uniqueRatio < 0.5) return 'categorical';
    
    return 'text';
  }

  detectNumericColumns(data) {
    const types = this.detectColumnTypes(data);
    return Object.keys(types).filter(col => types[col] === 'numeric');
  }

  detectKeyColumns(data) {
    // Simple heuristic to detect potential key columns
    const columns = Object.keys(data[0] || {});
    return columns.filter(col => {
      const values = data.map(row => row[col]);
      const uniqueRatio = new Set(values).size / values.length;
      return uniqueRatio > 0.9; // High uniqueness suggests key column
    });
  }

  createFuzzyKey(row) {
    // Create a fuzzy key for approximate duplicate detection
    return Object.values(row)
      .map(v => String(v).toLowerCase().trim())
      .join('|');
  }

  parseDate(value) {
    if (!value) return null;
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString();
    
    // Try common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/   // MM-DD-YYYY
    ];
    
    for (const format of formats) {
      if (format.test(String(value))) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return parsed.toISOString();
      }
    }
    
    return null;
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    
    const str = String(value).toLowerCase().trim();
    const trueValues = ['true', 'yes', 'y', '1', 'on', 'enabled'];
    const falseValues = ['false', 'no', 'n', '0', 'off', 'disabled'];
    
    if (trueValues.includes(str)) return true;
    if (falseValues.includes(str)) return false;
    
    return null;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateMode(values) {
    const frequency = {};
    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1;
    });
    
    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency).filter(k => frequency[k] === maxFreq);
    
    return modes[0]; // Return first mode
  }

  calculateOutlierBounds(values, strategy = 'iqr') {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;
    
    switch (strategy) {
      case 'iqr':
        return {
          lower: q1 - 1.5 * iqr,
          upper: q3 + 1.5 * iqr
        };
      case 'std':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
        return {
          lower: mean - 3 * std,
          upper: mean + 3 * std
        };
      default:
        return { lower: Math.min(...values), upper: Math.max(...values) };
    }
  }

  calculatePercentile(sorted, percentile) {
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  validateDataConsistency(data) {
    const validation = {
      isConsistent: true,
      issues: [],
      warnings: []
    };
    
    if (data.length === 0) {
      validation.isConsistent = false;
      validation.issues.push('No data rows found');
      return validation;
    }
    
    const columns = Object.keys(data[0]);
    const columnTypes = this.detectColumnTypes(data);
    
    // Check for consistent column types
    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
      const detectedType = columnTypes[column];
      
      if (detectedType === 'numeric') {
        const nonNumeric = values.filter(v => isNaN(parseFloat(v)));
        if (nonNumeric.length > 0) {
          validation.warnings.push(`Column '${column}' has ${nonNumeric.length} non-numeric values in numeric column`);
        }
      }
    });
    
    // Check for reasonable data ranges
    this.detectNumericColumns(data).forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      const range = Math.max(...values) - Math.min(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      
      if (range > mean * 1000) {
        validation.warnings.push(`Column '${column}' has unusually large range, potential data quality issues`);
      }
    });
    
    return validation;
  }

  calculateDataQuality(data) {
    if (data.length === 0) return { score: 0, details: {} };
    
    const columns = Object.keys(data[0]);
    const totalCells = data.length * columns.length;
    
    let nullCells = 0;
    let consistentCells = 0;
    
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
      nullCells += nullCount;
      
      // Check type consistency
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      if (nonNullValues.length > 0) {
        const expectedType = this.detectColumnType(nonNullValues);
        const consistentCount = nonNullValues.filter(v => {
          switch (expectedType) {
            case 'numeric': return !isNaN(parseFloat(v));
            case 'date': return this.parseDate(v) !== null;
            case 'boolean': return this.parseBoolean(v) !== null;
            default: return true;
          }
        }).length;
        consistentCells += consistentCount;
      }
    });
    
    const completeness = ((totalCells - nullCells) / totalCells) * 100;
    const consistency = (consistentCells / (totalCells - nullCells)) * 100;
    const score = (completeness + consistency) / 2;
    
    return {
      score: Math.round(score * 100) / 100,
      details: {
        completeness: Math.round(completeness * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        totalCells,
        nullCells,
        processedRows: data.length
      }
    };
  }
}

export default DataPreprocessor;
