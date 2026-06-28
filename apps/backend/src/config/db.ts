import mongoose from 'mongoose';

export const connectDatabase = async () => {
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
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    throw error;
  }
};
