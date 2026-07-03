import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDatabase } from './config/db';
import { ClientModel, InvoiceModel } from '@my-billing/database/server';

// Parse environment file from command line arguments (e.g. --env staging or --env production)
const envIndex = process.argv.indexOf('--env');
let envFile = '.env';
if (envIndex !== -1 && process.argv[envIndex + 1]) {
  const specifiedEnv = process.argv[envIndex + 1];
  envFile = `.env.${specifiedEnv}`;
}

const envPath = path.resolve(__dirname, `../${envFile}`);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment configuration from: ${envFile}`);
} else {
  // Fallback to default .env config loading behavior
  dotenv.config();
}

const cleanDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error(`CRITICAL ERROR: MONGODB_URI is not defined. (Looked in: ${envPath})`);
    process.exit(1);
  }

  // Mask database credentials for safe console logging
  const maskedUri = mongoUri.replace(/:([^@]+)@/, ':******@');
  
  console.log('\n==================================================');
  console.log(' DATABASE CLEANUP TOOL');
  console.log('==================================================');
  console.log(`Target Database: ${maskedUri}`);
  
  const isProduction = mongoUri.includes('my-billing-production') || process.env.NODE_ENV === 'production' || envFile.includes('production');
  if (isProduction) {
    console.log('\n⚠️  WARNING: Target database appears to be PRODUCTION!');
  } else {
    console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  }

  const hasConfirmFlag = process.argv.includes('--confirm');

  if (!hasConfirmFlag) {
    console.log('\n❌ OPERATION ABORTED: Confirmation Required');
    console.log('--------------------------------------------------');
    console.log('This script will permanently delete all data from:');
    console.log('  - clients collection');
    console.log('  - invoices / quotations / proforma collection');
    console.log('  - local uploads directory');
    console.log('\nTo execute the cleanup, you MUST pass the --confirm flag:');
    console.log('  npm run db:clear -- --confirm');
    console.log('Or specifying target env:');
    console.log('  npm run db:clear -- --env production --confirm\n');
    process.exit(0);
  }

  console.log('\n⏳ Initiating connection and cleanup...');
  try {
    await connectDatabase();
    
    // 1. Delete all invoices
    console.log('Clearing invoices and related documents...');
    const invoiceDeleteResult = await InvoiceModel.deleteMany({});
    console.log(`Successfully deleted ${invoiceDeleteResult.deletedCount} invoice/quotation records.`);

    // 2. Delete all clients
    console.log('Clearing clients...');
    const clientDeleteResult = await ClientModel.deleteMany({});
    console.log(`Successfully deleted ${clientDeleteResult.deletedCount} client records.`);

    // 3. Clear local uploads
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('Scanning uploads directory...');
      const files = fs.readdirSync(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFilesCount++;
        }
      }
      console.log(`Cleaned up uploads folder (deleted ${deletedFilesCount} files).`);
    }

    console.log('\n✅ Database and file assets cleaned successfully! Ready for client handover.');
  } catch (error: any) {
    console.error('\n❌ An error occurred during database cleanup:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.\n');
  }
};

cleanDatabase().catch((err) => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
