import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import UploadedFile from './models/UploadedFile.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/excelAnalytics')
  .then(() => {
    console.log('Connected to MongoDB');
    migrateFiles();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateFiles() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('No uploads directory found. Nothing to migrate.');
      process.exit(0);
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const filename of files) {
      try {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        // Skip if not a file
        if (!stats.isFile()) continue;

        // Check if file already exists in MongoDB
        const existingFile = await UploadedFile.findOne({ storedName: filename });
        if (existingFile) {
          console.log(`File ${filename} already exists in MongoDB, skipping...`);
          continue;
        }

        // Read file data
        const fileData = fs.readFileSync(filePath);
        
        // Determine mime type based on extension
        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.xlsx') {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (ext === '.xls') {
          mimeType = 'application/vnd.ms-excel';
        } else if (ext === '.csv') {
          mimeType = 'text/csv';
        }

        // Create a placeholder user ID (you may need to adjust this)
        const placeholderUserId = new mongoose.Types.ObjectId();

        // Create new file record in MongoDB
        const newFile = new UploadedFile({
          user: placeholderUserId,
          originalName: filename.replace(/^\d+-\d+-/, ''), // Remove timestamp prefix
          storedName: filename,
          size: stats.size,
          fileData: fileData,
          mimeType: mimeType,
          uploadedAt: stats.mtime,
          lastAccessed: stats.mtime,
          accessCount: 0,
          isActive: true
        });

        await newFile.save();
        console.log(`Migrated: ${filename}`);
        migratedCount++;

      } catch (error) {
        console.error(`Error migrating ${filename}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Successfully migrated: ${migratedCount} files`);
    console.log(`Errors: ${errorCount} files`);
    
    if (migratedCount > 0) {
      console.log(`\nNote: Migrated files are associated with a placeholder user ID.`);
      console.log(`You may want to reassign them to actual users or delete them.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
