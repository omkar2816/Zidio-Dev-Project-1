import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { protect } from '../middleware/auth.js';
import UploadedFile from '../models/UploadedFile.js';
import UserActivity from '../models/UserActivity.js';

const router = express.Router();

// Configure multer for memory storage (to store in MongoDB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  }
});

// Helper function to log activity
const logActivity = async (userId, activityType, description, fileId = null, fileName = null, metadata = {}) => {
  try {
    await UserActivity.logActivity({
      user: userId,
      activityType,
      description,
      fileId,
      fileName,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Upload and parse Excel file
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload an Excel or CSV file'
      });
    }

    // Parse Excel data from buffer
    const workbook = xlsx.read(req.file.buffer);
    const sheetNames = workbook.SheetNames;
    const sheets = {};

    // Parse each sheet
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to proper format
      const headers = jsonData[0];
      const rows = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      sheets[sheetName] = {
        headers,
        data: rows,
        totalRows: rows.length,
        totalColumns: headers.length
      };
    });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storedName = uniqueSuffix + '-' + sanitized;

    // Store file data in MongoDB
    const savedFile = await UploadedFile.create({
      user: req.user._id,
      originalName: req.file.originalname,
      storedName: storedName,
      size: req.file.size,
      fileData: req.file.buffer,
      mimeType: req.file.mimetype,
      parsedData: {
        sheets: sheets,
        sheetNames: sheetNames,
        totalSheets: sheetNames.length
      }
    });

    // Log activity
    await logActivity(
      req.user._id,
      'file_upload',
      `Uploaded file: ${req.file.originalname}`,
      savedFile._id,
      req.file.originalname,
      {
        fileSize: req.file.size,
        sheets: sheetNames.length,
        totalRows: Object.values(sheets).reduce((sum, sheet) => sum + sheet.totalRows, 0)
      }
    );

    res.json({
      success: true,
      message: 'File uploaded and parsed successfully',
      data: {
        fileId: savedFile._id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        sheets,
        sheetNames
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'File upload failed',
      message: 'Failed to process the uploaded file'
    });
  }
});

// List uploaded files for current user
router.get('/files', protect, async (req, res) => {
  try {
    const files = await UploadedFile.find({ user: req.user._id, isActive: true })
      .sort({ lastAccessed: -1 })
      .select('-fileData -__v');
    
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files', message: 'Internal server error' });
  }
});

// Get file data by ID
router.get('/files/:id', protect, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!file) {
      return res.status(404).json({ error: 'Not found', message: 'File not found' });
    }

    // Update access tracking
    await file.updateAccess();

    // Log activity
    await logActivity(
      req.user._id,
      'file_download',
      `Accessed file: ${file.originalName}`,
      file._id,
      file.originalName
    );

    res.json({
      success: true,
      data: {
        fileId: file._id,
        fileName: file.originalName,
        fileSize: file.size,
        sheets: file.parsedData.sheets,
        sheetNames: file.parsedData.sheetNames,
        lastAccessed: file.lastAccessed,
        accessCount: file.accessCount
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file', message: 'Internal server error' });
  }
});

// Delete an uploaded file
router.delete('/files/:id', protect, async (req, res) => {
  try {
    const file = await UploadedFile.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!file) {
      return res.status(404).json({ error: 'Not found', message: 'File not found' });
    }

    // Soft delete - mark as inactive
    file.isActive = false;
    await file.save();

    // Log activity
    await logActivity(
      req.user._id,
      'file_delete',
      `Deleted file: ${file.originalName}`,
      file._id,
      file.originalName,
      { fileSize: file.size }
    );

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file', message: 'Internal server error' });
  }
});

// Get recent activities for current user
router.get('/activities', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await UserActivity.getRecentActivities(req.user._id, limit);
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to get activities', message: 'Internal server error' });
  }
});

// Generate basic analytics from Excel data
router.post('/analyze', protect, async (req, res) => {
  try {
    const { sheetData, analysisType } = req.body;

    if (!sheetData || !sheetData.data || !sheetData.headers) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Please provide valid sheet data'
      });
    }

    const { headers, data } = sheetData;
    const analytics = {};

    // Basic statistics for numeric columns
    const numericColumns = headers.filter((header, index) => {
      return data.some(row => {
        const value = row[header];
        return !isNaN(parseFloat(value)) && value !== '';
      });
    });

    numericColumns.forEach(column => {
      const values = data
        .map(row => parseFloat(row[column]))
        .filter(val => !isNaN(val));

      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        const sorted = values.sort((a, b) => a - b);
        const median = sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

        analytics[column] = {
          count: values.length,
          sum: sum.toFixed(2),
          mean: mean.toFixed(2),
          median: median.toFixed(2),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          range: (Math.max(...values) - Math.min(...values)).toFixed(2)
        };
      }
    });

    // Categorical analysis for non-numeric columns
    const categoricalColumns = headers.filter(header => !numericColumns.includes(header));
    
    categoricalColumns.forEach(column => {
      const values = data.map(row => row[column]).filter(val => val !== '');
      const valueCounts = {};
      
      values.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });

      analytics[column] = {
        uniqueValues: Object.keys(valueCounts).length,
        totalValues: values.length,
        valueCounts,
        topValues: Object.entries(valueCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }))
      };
    });

    // Generate chart data
    const chartData = {
      barCharts: [],
      lineCharts: [],
      pieCharts: []
    };

    // Bar chart data for top categorical values
    categoricalColumns.forEach(column => {
      if (analytics[column] && analytics[column].topValues.length > 0) {
        chartData.barCharts.push({
          title: `${column} Distribution`,
          data: analytics[column].topValues,
          xAxis: 'value',
          yAxis: 'count'
        });
      }
    });

    // Line chart data for numeric columns (first 20 data points)
    numericColumns.forEach(column => {
      const values = data
        .map((row, index) => ({ x: index + 1, y: parseFloat(row[column]) }))
        .filter(point => !isNaN(point.y))
        .slice(0, 20);

      if (values.length > 0) {
        chartData.lineCharts.push({
          title: `${column} Trend`,
          data: values,
          xAxis: 'Index',
          yAxis: column
        });
      }
    });

    // Pie chart data for categorical columns
    categoricalColumns.forEach(column => {
      if (analytics[column] && analytics[column].topValues.length > 0) {
        chartData.pieCharts.push({
          title: `${column} Distribution`,
          data: analytics[column].topValues.map(item => ({
            name: item.value,
            value: item.count
          }))
        });
      }
    });

    // Log activity
    await logActivity(
      req.user._id,
      'data_analysis',
      `Performed data analysis on ${data.length} rows`,
      null,
      null,
      {
        analysisType,
        totalRows: data.length,
        totalColumns: headers.length,
        numericColumns: numericColumns.length,
        categoricalColumns: categoricalColumns.length
      }
    );

    res.json({
      success: true,
      message: 'Data analysis completed',
      data: {
        analytics,
        chartData,
        summary: {
          totalRows: data.length,
          totalColumns: headers.length,
          numericColumns: numericColumns.length,
          categoricalColumns: categoricalColumns.length
        }
      }
    });
  } catch (error) {
    console.error('Data analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Failed to analyze the data'
    });
  }
});

// Generate 3D chart data
router.post('/3d-charts', protect, async (req, res) => {
  try {
    const { sheetData } = req.body;

    if (!sheetData || !sheetData.data || !sheetData.headers) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Please provide valid sheet data'
      });
    }

    const { headers, data } = sheetData;
    const numericColumns = headers.filter((header, index) => {
      return data.some(row => {
        const value = row[header];
        return !isNaN(parseFloat(value)) && value !== '';
      });
    });

    const chart3DData = [];

    // Generate 3D scatter plot data (using first 3 numeric columns)
    if (numericColumns.length >= 3) {
      const xColumn = numericColumns[0];
      const yColumn = numericColumns[1];
      const zColumn = numericColumns[2];

      const scatterData = data
        .map(row => ({
          x: parseFloat(row[xColumn]),
          y: parseFloat(row[yColumn]),
          z: parseFloat(row[zColumn])
        }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z))
        .slice(0, 100); // Limit to 100 points for performance

      chart3DData.push({
        type: 'scatter3d',
        title: `${xColumn} vs ${yColumn} vs ${zColumn}`,
        data: scatterData,
        axes: {
          x: xColumn,
          y: yColumn,
          z: zColumn
        }
      });
    }

    // Generate 3D surface data (if we have enough data)
    if (numericColumns.length >= 2 && data.length >= 10) {
      const xColumn = numericColumns[0];
      const yColumn = numericColumns[1];

      // Create a grid for surface plot
      const xValues = [...new Set(data.map(row => parseFloat(row[xColumn])).filter(val => !isNaN(val)))].sort((a, b) => a - b);
      const yValues = [...new Set(data.map(row => parseFloat(row[yColumn])).filter(val => !isNaN(val)))].sort((a, b) => a - b);

      if (xValues.length > 0 && yValues.length > 0) {
        const surfaceData = [];
        
        // Create a simple surface based on the data
        for (let i = 0; i < Math.min(xValues.length, 20); i++) {
          for (let j = 0; j < Math.min(yValues.length, 20); j++) {
            const x = xValues[i];
            const y = yValues[j];
            const z = Math.sin(x / 10) * Math.cos(y / 10) * 10; // Simple mathematical surface
            
            surfaceData.push({ x, y, z });
          }
        }

        chart3DData.push({
          type: 'surface3d',
          title: `${xColumn} vs ${yColumn} Surface`,
          data: surfaceData,
          axes: {
            x: xColumn,
            y: yColumn,
            z: 'Calculated'
          }
        });
      }
    }

    // Log activity
    await logActivity(
      req.user._id,
      'chart_generation',
      `Generated 3D charts from ${data.length} rows`,
      null,
      null,
      {
        chartType: '3d',
        totalCharts: chart3DData.length,
        totalRows: data.length
      }
    );

    res.json({
      success: true,
      message: '3D chart data generated',
      data: {
        charts3D: chart3DData
      }
    });
  } catch (error) {
    console.error('3D chart generation error:', error);
    res.status(500).json({
      error: '3D chart generation failed',
      message: 'Failed to generate 3D chart data'
    });
  }
});

// Export processed data
router.post('/export', protect, async (req, res) => {
  try {
    const { sheetData, format } = req.body;

    if (!sheetData || !sheetData.data || !sheetData.headers) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Please provide valid sheet data'
      });
    }

    const { headers, data } = sheetData;

    // Log activity
    await logActivity(
      req.user._id,
      'data_export',
      `Exported data in ${format.toUpperCase()} format`,
      null,
      null,
      {
        format,
        totalRows: data.length,
        totalColumns: headers.length
      }
    );

    if (format === 'json') {
      res.json({
        success: true,
        data: {
          headers,
          data,
          totalRows: data.length,
          totalColumns: headers.length
        }
      });
    } else if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="exported_data.csv"');
      res.send(csvContent);
    } else {
      res.status(400).json({
        error: 'Invalid format',
        message: 'Supported formats: json, csv'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Failed to export data'
    });
  }
});

export default router;
