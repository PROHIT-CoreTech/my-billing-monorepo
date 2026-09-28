import mongoose from 'mongoose';

export const connectDatabase = async () => {
  // Reuse existing database connection in serverless warm invocations
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('CRITICAL DATABASE ERROR: MONGODB_URI environment variable is missing!');
    console.error('Please configure MONGODB_URI in your Vercel Project Settings -> Environment Variables.');
    throw new Error('MONGODB_URI environment variable is not defined.');
  }
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (error: any) {
    if (error.message && error.message.includes('bad auth')) {
      console.error('\n=============================================================');
      console.error('❌ MONGODB AUTHENTICATION ERROR (bad auth)');
      console.error('-------------------------------------------------------------');
      console.error('The username or password in MONGODB_URI in apps/backend/.env is invalid.');
      console.error('Please update MONGODB_URI with your correct MongoDB Atlas password or connection string.');
      console.error('=============================================================\n');
    } else {
      console.error('Error connecting to MongoDB Atlas:', error);
    }
    throw error;
  }
};
