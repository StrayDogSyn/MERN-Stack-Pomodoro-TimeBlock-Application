/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Vercel function invoked:', req.method, req.url);
    return app(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}