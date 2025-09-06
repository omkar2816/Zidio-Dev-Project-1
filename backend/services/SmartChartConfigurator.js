class SmartChartConfigurator {
  constructor() {
    this.dataPatterns = new Map();
    this.chartTypeWeights = {
      bar: 0,
      line: 0,
      scatter: 0,
      pie: 0,
      area: 0,
      histogram: 0,
      bubble: 0,
      radar: 0,
      box: 0
    };
  }

  /**
   * Main auto-configuration method
   */
  generateAutoConfiguration(data, userPreferences = {}) {
    try {
      console.log('Generating smart chart configuration...', { rows: data.length });
      
      if (!data || data.length === 0) {
        throw new Error('No data provided for configuration');
      }

      // Analyze data structure and patterns
      const analysis = this.analyzeDataStructure(data);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis, userPreferences);
      
      // Create specific configurations
      const configurations = this.createChartConfigurations(analysis, recommendations);
      
      return {
        analysis,
        recommendations,
        configurations,
        autoSelections: this.generateAutoSelections(analysis),
        metadata: {
          dataSize: data.length,
          columnCount: Object.keys(data[0] || {}).length,
          confidenceScore: this.calculateConfidenceScore(analysis, recommendations)
        }
      };
      
    } catch (error) {
      console.error('Smart configuration error:', error);
      throw new Error(`Smart configuration failed: ${error.message}`);
    }
  }

  /**
   * Analyze data structure and detect patterns
   */
  analyzeDataStructure(data) {
    const columns = Object.keys(data[0] || {});
    const analysis = {
      columns: {},
      patterns: {
        temporal: false,
        categorical: false,
        numerical: false,
        hierarchical: false,
        correlation: false
      },
      relationships: [],
      dataTypes: {},
      distributions: {}
    };

    // Analyze each column
    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
      analysis.columns[column] = this.analyzeColumn(column, values);
      analysis.dataTypes[column] = analysis.columns[column].type;
    });

    // Detect data patterns
    analysis.patterns = this.detectDataPatterns(analysis.columns);
    
    // Analyze relationships between columns
    analysis.relationships = this.analyzeRelationships(data, analysis.columns);
    
    // Analyze distributions for numeric columns
    analysis.distributions = this.analyzeDistributions(data, analysis.columns);

    return analysis;
  }

  /**
   * Analyze individual column
   */
  analyzeColumn(columnName, values) {
    if (values.length === 0) {
      return { type: 'empty', role: 'none', quality: 0 };
    }

    const sampleSize = Math.min(values.length, 1000);
    const sample = values.slice(0, sampleSize);
    
    // Detect data type
    const type = this.detectDataType(sample);
    
    // Determine column role
    const role = this.determineColumnRole(columnName, sample, type);
    
    // Calculate quality metrics
    const quality = this.calculateColumnQuality(sample);
    
    // Additional analysis based on type
    const additionalInfo = this.getAdditionalColumnInfo(sample, type);

    return {
      type,
      role,
      quality,
      uniqueValues: new Set(sample).size,
      uniqueRatio: new Set(sample).size / sample.length,
      sampleValues: sample.slice(0, 5),
      ...additionalInfo
    };
  }

  /**
   * Detect data type with improved accuracy
   */
  detectDataType(values) {
    const patterns = {
      numeric: 0,
      date: 0,
      categorical: 0,
      boolean: 0,
      text: 0
    };

    values.forEach(value => {
      const str = String(value).trim();
      
      // Check numeric
      if (!isNaN(parseFloat(str)) && isFinite(str)) {
        patterns.numeric++;
      }
      
      // Check date
      if (this.isDate(str)) {
        patterns.date++;
      }
      
      // Check boolean
      if (this.isBoolean(str)) {
        patterns.boolean++;
      }
      
      // Check if categorical (repeated values)
      // This will be determined by uniqueness ratio
    });

    // Determine final type based on highest confidence
    const total = values.length;
    const confidence = Object.keys(patterns).map(type => ({
      type,
      score: patterns[type] / total,
      count: patterns[type]
    })).sort((a, b) => b.score - a.score);

    const winner = confidence[0];
    
    // Special case for categorical data
    const uniqueRatio = new Set(values).size / values.length;
    if (winner.type === 'text' || (winner.score < 0.8 && uniqueRatio < 0.5)) {
      return 'categorical';
    }

    // Return the type with highest confidence if above threshold
    return winner.score > 0.7 ? winner.type : 'text';
  }

  /**
   * Determine column role for charting
   */
  determineColumnRole(columnName, values, type) {
    const name = columnName.toLowerCase();
    
    // Check for common dimension indicators
    const dimensionKeywords = ['id', 'name', 'category', 'type', 'group', 'class', 'label'];
    const timeKeywords = ['date', 'time', 'year', 'month', 'day', 'created', 'updated'];
    const measureKeywords = ['amount', 'value', 'price', 'cost', 'count', 'total', 'sum', 'avg'];

    if (timeKeywords.some(keyword => name.includes(keyword)) || type === 'date') {
      return 'temporal';
    }
    
    if (measureKeywords.some(keyword => name.includes(keyword)) || type === 'numeric') {
      return 'measure';
    }
    
    if (dimensionKeywords.some(keyword => name.includes(keyword)) || type === 'categorical') {
      return 'dimension';
    }

    // Default role based on type
    switch (type) {
      case 'numeric': return 'measure';
      case 'date': return 'temporal';
      case 'categorical': return 'dimension';
      case 'boolean': return 'dimension';
      default: return 'dimension';
    }
  }

  /**
   * Detect data patterns
   */
  detectDataPatterns(columns) {
    const patterns = {
      temporal: false,
      categorical: false,
      numerical: false,
      hierarchical: false,
      correlation: false
    };

    const columnTypes = Object.values(columns).map(col => col.type);
    const columnRoles = Object.values(columns).map(col => col.role);

    patterns.temporal = columnRoles.includes('temporal');
    patterns.categorical = columnRoles.includes('dimension');
    patterns.numerical = columnRoles.includes('measure');
    
    // Check for hierarchical data (multiple categorical columns)
    const categoricalCount = columnRoles.filter(role => role === 'dimension').length;
    patterns.hierarchical = categoricalCount > 1;

    // Check for correlation potential (multiple numeric columns)
    const numericCount = columnTypes.filter(type => type === 'numeric').length;
    patterns.correlation = numericCount > 1;

    return patterns;
  }

  /**
   * Analyze relationships between columns
   */
  analyzeRelationships(data, columns) {
    const relationships = [];
    const columnNames = Object.keys(columns);
    
    // Find potential X-Y relationships
    for (let i = 0; i < columnNames.length; i++) {
      for (let j = i + 1; j < columnNames.length; j++) {
        const col1 = columnNames[i];
        const col2 = columnNames[j];
        
        const relationship = this.analyzeColumnRelationship(data, col1, col2, columns);
        if (relationship.strength > 0.3) {
          relationships.push(relationship);
        }
      }
    }

    return relationships.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Analyze relationship between two columns
   */
  analyzeColumnRelationship(data, col1, col2, columns) {
    const values1 = data.map(row => row[col1]).filter(v => v !== null && v !== undefined);
    const values2 = data.map(row => row[col2]).filter(v => v !== null && v !== undefined);
    
    const type1 = columns[col1].type;
    const type2 = columns[col2].type;
    
    let strength = 0;
    let relationshipType = 'none';
    let recommendation = null;

    // Numeric vs Numeric - correlation
    if (type1 === 'numeric' && type2 === 'numeric') {
      strength = Math.abs(this.calculateCorrelation(values1, values2));
      relationshipType = 'correlation';
      recommendation = strength > 0.7 ? 'scatter' : strength > 0.5 ? 'line' : null;
    }
    
    // Categorical vs Numeric - aggregation relationship
    else if ((type1 === 'categorical' && type2 === 'numeric') || 
             (type1 === 'numeric' && type2 === 'categorical')) {
      const catCol = type1 === 'categorical' ? col1 : col2;
      const numCol = type1 === 'numeric' ? col1 : col2;
      
      strength = this.calculateCategoricalNumericStrength(data, catCol, numCol);
      relationshipType = 'categorical-numeric';
      recommendation = strength > 0.5 ? 'bar' : null;
    }
    
    // Temporal vs Numeric - time series
    else if ((columns[col1].role === 'temporal' && type2 === 'numeric') ||
             (columns[col2].role === 'temporal' && type1 === 'numeric')) {
      strength = 0.8; // High for time series
      relationshipType = 'time-series';
      recommendation = 'line';
    }

    return {
      column1: col1,
      column2: col2,
      strength,
      relationshipType,
      recommendation,
      suggestedAsXY: this.suggestXYMapping(col1, col2, columns)
    };
  }

  /**
   * Generate chart recommendations
   */
  generateRecommendations(analysis, userPreferences = {}) {
    const recommendations = [];
    
    // Reset weights
    Object.keys(this.chartTypeWeights).forEach(type => {
      this.chartTypeWeights[type] = 0;
    });

    // Score based on data patterns
    this.scoreByPatterns(analysis.patterns);
    
    // Score based on relationships
    this.scoreByRelationships(analysis.relationships);
    
    // Score based on data structure
    this.scoreByDataStructure(analysis);

    // Apply user preferences
    this.applyUserPreferences(userPreferences);

    // Generate final recommendations
    const sortedTypes = Object.entries(this.chartTypeWeights)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    sortedTypes.forEach(([type, score], index) => {
      const recommendation = this.createChartRecommendation(type, score, analysis, index);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    return recommendations;
  }

  /**
   * Create chart configurations based on recommendations
   */
  createChartConfigurations(analysis, recommendations) {
    const configurations = [];
    
    recommendations.slice(0, 5).forEach((rec, index) => {
      const config = this.generateSpecificConfiguration(rec, analysis, index);
      if (config) {
        configurations.push(config);
      }
    });

    return configurations;
  }

  /**
   * Generate specific chart configuration
   */
  generateSpecificConfiguration(recommendation, analysis, index) {
    const columnNames = Object.keys(analysis.columns);
    const config = {
      type: recommendation.type,
      title: recommendation.title,
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      autoSelected: true
    };

    // Auto-select axes based on chart type and data analysis
    switch (recommendation.type) {
      case 'bar':
      case 'pie':
        config.xAxis = this.selectBestCategoricalColumn(analysis);
        config.yAxis = this.selectBestNumericColumn(analysis);
        config.groupBy = config.xAxis;
        break;
        
      case 'line':
      case 'area':
        config.xAxis = this.selectBestTemporalColumn(analysis) || this.selectBestNumericalColumn(analysis, 'x');
        config.yAxis = this.selectBestNumericColumn(analysis);
        break;
        
      case 'scatter':
        const relationship = analysis.relationships.find(rel => rel.relationshipType === 'correlation');
        if (relationship) {
          config.xAxis = relationship.column1;
          config.yAxis = relationship.column2;
        } else {
          config.xAxis = this.selectBestNumericalColumn(analysis, 'x');
          config.yAxis = this.selectBestNumericalColumn(analysis, 'y');
        }
        break;
        
      case 'histogram':
        config.xAxis = this.selectBestNumericColumn(analysis);
        config.bins = this.calculateOptimalBins(analysis, config.xAxis);
        break;
        
      case 'bubble':
        config.xAxis = this.selectBestNumericalColumn(analysis, 'x');
        config.yAxis = this.selectBestNumericalColumn(analysis, 'y');
        config.sizeAxis = this.selectBestNumericalColumn(analysis, 'size');
        break;
        
      case 'radar':
        config.dimensions = this.selectRadarDimensions(analysis);
        break;
        
      case 'box':
        config.yAxis = this.selectBestNumericColumn(analysis);
        config.groupBy = this.selectBestCategoricalColumn(analysis);
        break;
    }

    // Add filters and series suggestions
    config.suggestedFilters = this.suggestFilters(analysis);
    config.suggestedSeries = this.suggestSeries(analysis, config);

    return config;
  }

  // Helper methods for column selection
  selectBestCategoricalColumn(analysis) {
    const categoricalColumns = Object.entries(analysis.columns)
      .filter(([name, info]) => info.role === 'dimension' || info.type === 'categorical')
      .sort(([,a], [,b]) => b.quality - a.quality);
    
    return categoricalColumns.length > 0 ? categoricalColumns[0][0] : null;
  }

  selectBestNumericColumn(analysis) {
    const numericColumns = Object.entries(analysis.columns)
      .filter(([name, info]) => info.type === 'numeric' || info.role === 'measure')
      .sort(([,a], [,b]) => b.quality - a.quality);
    
    return numericColumns.length > 0 ? numericColumns[0][0] : null;
  }

  selectBestTemporalColumn(analysis) {
    const temporalColumns = Object.entries(analysis.columns)
      .filter(([name, info]) => info.role === 'temporal' || info.type === 'date')
      .sort(([,a], [,b]) => b.quality - a.quality);
    
    return temporalColumns.length > 0 ? temporalColumns[0][0] : null;
  }

  selectBestNumericalColumn(analysis, purpose) {
    const numericColumns = Object.entries(analysis.columns)
      .filter(([name, info]) => info.type === 'numeric')
      .sort(([,a], [,b]) => b.quality - a.quality);
    
    // Return different columns for x, y, size based on purpose
    const index = purpose === 'x' ? 0 : purpose === 'y' ? 1 : 2;
    return numericColumns.length > index ? numericColumns[index][0] : 
           numericColumns.length > 0 ? numericColumns[0][0] : null;
  }

  // Additional helper methods
  isDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900;
  }

  isBoolean(value) {
    const str = String(value).toLowerCase().trim();
    return ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'].includes(str);
  }

  calculateCorrelation(values1, values2) {
    const n = Math.min(values1.length, values2.length);
    if (n < 2) return 0;
    
    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateCategoricalNumericStrength(data, catCol, numCol) {
    const groups = {};
    data.forEach(row => {
      const category = row[catCol];
      const value = parseFloat(row[numCol]);
      if (!isNaN(value)) {
        if (!groups[category]) groups[category] = [];
        groups[category].push(value);
      }
    });
    
    const categoryCount = Object.keys(groups).length;
    const hasSignificantDifferences = this.hasSignificantVariance(groups);
    
    // Strength based on category count and variance
    let strength = Math.min(categoryCount / 10, 1) * 0.5;
    if (hasSignificantDifferences) strength += 0.3;
    
    return Math.min(strength, 1);
  }

  hasSignificantVariance(groups) {
    const means = Object.values(groups).map(values => 
      values.reduce((a, b) => a + b, 0) / values.length
    );
    
    if (means.length < 2) return false;
    
    const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
    const variance = means.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / means.length;
    
    return variance > overallMean * 0.1; // Significant if variance > 10% of mean
  }

  // Scoring methods
  scoreByPatterns(patterns) {
    if (patterns.temporal && patterns.numerical) {
      this.chartTypeWeights.line += 0.8;
      this.chartTypeWeights.area += 0.6;
    }
    
    if (patterns.categorical && patterns.numerical) {
      this.chartTypeWeights.bar += 0.7;
      this.chartTypeWeights.pie += 0.5;
    }
    
    if (patterns.correlation) {
      this.chartTypeWeights.scatter += 0.8;
      this.chartTypeWeights.bubble += 0.6;
    }
    
    if (patterns.hierarchical) {
      this.chartTypeWeights.radar += 0.4;
      this.chartTypeWeights.box += 0.5;
    }
  }

  scoreByRelationships(relationships) {
    relationships.forEach(rel => {
      if (rel.recommendation && this.chartTypeWeights[rel.recommendation] !== undefined) {
        this.chartTypeWeights[rel.recommendation] += rel.strength * 0.5;
      }
    });
  }

  scoreByDataStructure(analysis) {
    const columnCount = Object.keys(analysis.columns).length;
    const numericCount = Object.values(analysis.columns).filter(col => col.type === 'numeric').length;
    const categoricalCount = Object.values(analysis.columns).filter(col => col.type === 'categorical').length;
    
    // Boost charts suitable for data structure
    if (numericCount >= 2) {
      this.chartTypeWeights.scatter += 0.3;
      this.chartTypeWeights.bubble += 0.2;
    }
    
    if (categoricalCount >= 1 && numericCount >= 1) {
      this.chartTypeWeights.bar += 0.3;
      this.chartTypeWeights.box += 0.2;
    }
    
    if (numericCount === 1) {
      this.chartTypeWeights.histogram += 0.4;
    }
  }

  applyUserPreferences(preferences) {
    if (preferences.preferredTypes) {
      preferences.preferredTypes.forEach(type => {
        if (this.chartTypeWeights[type] !== undefined) {
          this.chartTypeWeights[type] += 0.2;
        }
      });
    }
    
    if (preferences.avoidTypes) {
      preferences.avoidTypes.forEach(type => {
        if (this.chartTypeWeights[type] !== undefined) {
          this.chartTypeWeights[type] *= 0.5;
        }
      });
    }
  }

  createChartRecommendation(type, score, analysis, index) {
    const titles = {
      bar: 'Category Analysis',
      line: 'Trend Analysis',
      scatter: 'Correlation Analysis',
      pie: 'Distribution Overview',
      area: 'Cumulative Trends',
      histogram: 'Value Distribution',
      bubble: 'Multi-dimensional Analysis',
      radar: 'Performance Comparison',
      box: 'Statistical Summary'
    };
    
    return {
      type,
      title: titles[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      priority: 5 - index,
      confidence: Math.min(score, 1),
      reasoning: this.generateReasoning(type, analysis),
      suitability: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low'
    };
  }

  generateReasoning(type, analysis) {
    const reasons = [];
    
    switch (type) {
      case 'bar':
        if (analysis.patterns.categorical) reasons.push('categorical data detected');
        if (analysis.patterns.numerical) reasons.push('numeric measures available');
        break;
      case 'line':
        if (analysis.patterns.temporal) reasons.push('time-based data detected');
        if (analysis.patterns.numerical) reasons.push('continuous data trends');
        break;
      case 'scatter':
        if (analysis.patterns.correlation) reasons.push('multiple numeric variables');
        break;
    }
    
    return reasons.join(', ') || 'suitable for data structure';
  }

  generateAutoSelections(analysis) {
    return {
      recommendedXAxis: this.selectBestTemporalColumn(analysis) || this.selectBestCategoricalColumn(analysis),
      recommendedYAxis: this.selectBestNumericColumn(analysis),
      recommendedSeries: this.selectBestCategoricalColumn(analysis),
      recommendedFilters: this.suggestFilters(analysis)
    };
  }

  suggestFilters(analysis) {
    return Object.entries(analysis.columns)
      .filter(([name, info]) => info.type === 'categorical' && info.uniqueRatio < 0.8)
      .map(([name]) => name)
      .slice(0, 3);
  }

  suggestSeries(analysis, config) {
    const categoricalColumns = Object.entries(analysis.columns)
      .filter(([name, info]) => info.type === 'categorical' && name !== config.xAxis)
      .sort(([,a], [,b]) => a.uniqueValues - b.uniqueValues);
    
    return categoricalColumns.length > 0 ? categoricalColumns[0][0] : null;
  }

  calculateConfidenceScore(analysis, recommendations) {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length;
    const dataQualityScore = this.calculateDataQualityScore(analysis);
    
    return (avgConfidence + dataQualityScore) / 2;
  }

  calculateDataQualityScore(analysis) {
    const columns = Object.values(analysis.columns);
    if (columns.length === 0) return 0;
    
    const avgQuality = columns.reduce((sum, col) => sum + col.quality, 0) / columns.length;
    return avgQuality;
  }

  calculateColumnQuality(values) {
    if (values.length === 0) return 0;
    
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    const uniqueRatio = new Set(values).size / values.length;
    
    const completeness = (values.length - nullCount) / values.length;
    const diversity = Math.min(uniqueRatio * 2, 1); // Cap at 1
    
    return (completeness + diversity) / 2;
  }

  getAdditionalColumnInfo(values, type) {
    const info = {};
    
    if (type === 'numeric') {
      const numValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      info.min = Math.min(...numValues);
      info.max = Math.max(...numValues);
      info.mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
    }
    
    if (type === 'categorical') {
      const frequency = {};
      values.forEach(v => {
        frequency[v] = (frequency[v] || 0) + 1;
      });
      info.topCategories = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([cat, count]) => ({ category: cat, count }));
    }
    
    return info;
  }

  suggestXYMapping(col1, col2, columns) {
    const col1Info = columns[col1];
    const col2Info = columns[col2];
    
    // Temporal columns typically go on X-axis
    if (col1Info.role === 'temporal') return { x: col1, y: col2 };
    if (col2Info.role === 'temporal') return { x: col2, y: col1 };
    
    // Categorical columns typically go on X-axis
    if (col1Info.type === 'categorical' && col2Info.type === 'numeric') return { x: col1, y: col2 };
    if (col2Info.type === 'categorical' && col1Info.type === 'numeric') return { x: col2, y: col1 };
    
    // For numeric vs numeric, use quality or alphabetical
    if (col1Info.quality >= col2Info.quality) return { x: col1, y: col2 };
    return { x: col2, y: col1 };
  }

  selectRadarDimensions(analysis) {
    return Object.entries(analysis.columns)
      .filter(([name, info]) => info.type === 'numeric')
      .sort(([,a], [,b]) => b.quality - a.quality)
      .slice(0, 6)
      .map(([name]) => name);
  }

  calculateOptimalBins(analysis, columnName) {
    const column = analysis.columns[columnName];
    if (!column || column.type !== 'numeric') return 10;
    
    // Use Sturges' rule as a starting point
    const dataPoints = analysis.dataSize || 100;
    return Math.max(5, Math.min(50, Math.ceil(Math.log2(dataPoints) + 1)));
  }
}

export default SmartChartConfigurator;
