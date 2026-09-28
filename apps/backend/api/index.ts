import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Failed to connect to database in Vercel serverless handler:', error);
  }
  return app(req, res);
}
