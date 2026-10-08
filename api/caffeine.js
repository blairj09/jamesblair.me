// Vercel Edge Function for Caffeine Tracker Data Persistence
// This provides cross-device sync for caffeine tracking data

import { kv } from '@vercel/kv';

// Constants
const MAX_DATA_SIZE = 50000; // 50KB max per user
const DATA_TTL = 60 * 60 * 24 * 90; // 90 days expiration

export default async function handler(req, res) {
  // Allowed origins for CORS
  const allowedOrigins = [
    'https://www.jamesblair.me',
    'https://jamesblair.me',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ];

  const origin = req.headers.origin;

  // Allow Vercel preview deployments
  const isYourVercelPreview = origin && origin.includes('james-blairs-projects.vercel.app');
  const isAllowedOrigin = allowedOrigins.includes(origin) || isYourVercelPreview;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate origin
  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Forbidden: Invalid origin' });
  }

  try {
    const { method } = req;

    if (method === 'GET') {
      // Get caffeine data for a user
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string' || userId.length < 10) {
        return res.status(400).json({ error: 'Valid userId is required' });
      }

      // Sanitize userId - only allow alphanumeric and hyphens
      if (!/^[a-zA-Z0-9-]+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
      }

      const key = `caffeine:${userId}`;
      const data = await kv.get(key);

      if (!data) {
        return res.status(200).json({
          doses: [],
          halfLife: 5.5,
          timeWindow: 24,
          lastSync: null
        });
      }

      return res.status(200).json(data);

    } else if (method === 'POST') {
      // Save caffeine data for a user
      const { userId, doses, halfLife, timeWindow } = req.body;

      if (!userId || typeof userId !== 'string' || userId.length < 10) {
        return res.status(400).json({ error: 'Valid userId is required' });
      }

      // Sanitize userId
      if (!/^[a-zA-Z0-9-]+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
      }

      // Validate data
      if (!Array.isArray(doses)) {
        return res.status(400).json({ error: 'doses must be an array' });
      }

      if (typeof halfLife !== 'number' || halfLife < 3 || halfLife > 8) {
        return res.status(400).json({ error: 'halfLife must be a number between 3 and 8' });
      }

      if (typeof timeWindow !== 'number' || timeWindow < 6 || timeWindow > 48) {
        return res.status(400).json({ error: 'timeWindow must be a number between 6 and 48' });
      }

      // Validate each dose
      for (const dose of doses) {
        if (typeof dose.amount !== 'number' || dose.amount < 0 || dose.amount > 1000) {
          return res.status(400).json({ error: 'Invalid dose amount' });
        }
        if (typeof dose.timestamp !== 'number') {
          return res.status(400).json({ error: 'Invalid dose timestamp' });
        }
      }

      // Check data size
      const dataToStore = {
        doses,
        halfLife,
        timeWindow,
        lastSync: new Date().toISOString()
      };

      const dataSize = JSON.stringify(dataToStore).length;
      if (dataSize > MAX_DATA_SIZE) {
        return res.status(400).json({ error: 'Data too large. Please clear old history.' });
      }

      // Store data with expiration
      const key = `caffeine:${userId}`;
      await kv.set(key, dataToStore, { ex: DATA_TTL });

      return res.status(200).json({
        success: true,
        message: 'Data saved successfully',
        lastSync: dataToStore.lastSync
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Caffeine API error:', error);
    return res.status(500).json({
      error: 'Internal server error. Please try again later.'
    });
  }
}
