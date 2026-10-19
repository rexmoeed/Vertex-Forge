import { Router, Request, Response } from 'express';
import { validateBody, CommonSchemas } from '../middleware/validation';

function getJulesApiKey(req: Request): string | undefined {
  const headerKey = req.headers['x-goog-api-key'] as string;
  return headerKey || process.env.JULES_API_KEY;
}

// List connected GitHub sources/repositories

export function createJulesRouter(): Router {
  const router = Router();

router.get('/api/jules/sources', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required. Set JULES_API_KEY in .env or provide x-goog-api-key header.' });
  }

  try {
    const url = new URL('https://jules.googleapis.com/v1alpha/sources');
    if (req.query.pageSize) url.searchParams.set('pageSize', String(req.query.pageSize));
    if (req.query.pageToken) url.searchParams.set('pageToken', String(req.query.pageToken));

    const response = await fetch(url.toString(), {
      headers: { 'x-goog-api-key': apiKey },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch Jules sources', details: err?.message });
  }
});

// List coding sessions
router.get('/api/jules/sessions', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const url = new URL('https://jules.googleapis.com/v1alpha/sessions');
    if (req.query.pageSize) url.searchParams.set('pageSize', String(req.query.pageSize));
    if (req.query.pageToken) url.searchParams.set('pageToken', String(req.query.pageToken));

    const response = await fetch(url.toString(), {
      headers: { 'x-goog-api-key': apiKey },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to list Jules sessions', details: err?.message });
  }
});

// Create an autonomous coding session
router.post('/api/jules/sessions', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const response = await fetch('https://jules.googleapis.com/v1alpha/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create Jules session', details: err?.message });
  }
});

// Get session details
router.get('/api/jules/sessions/:id', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const sessionId = encodeURIComponent(req.params.id);
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions/${sessionId}`, {
      headers: { 'x-goog-api-key': apiKey },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get Jules session', details: err?.message });
  }
});

// Get activities/steps within a session
router.get('/api/jules/sessions/:id/activities', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const sessionId = encodeURIComponent(req.params.id);
    const url = new URL(`https://jules.googleapis.com/v1alpha/sessions/${sessionId}/activities`);
    if (req.query.pageSize) url.searchParams.set('pageSize', String(req.query.pageSize));
    if (req.query.pageToken) url.searchParams.set('pageToken', String(req.query.pageToken));

    const response = await fetch(url.toString(), {
      headers: { 'x-goog-api-key': apiKey },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get Jules activities', details: err?.message });
  }
});

// Approve execution plan
router.post('/api/jules/sessions/:id/approve', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const sessionId = encodeURIComponent(req.params.id);
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions/${sessionId}:approvePlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to approve Jules plan', details: err?.message });
  }
});

// Send message to active session
router.post('/api/jules/sessions/:id/message', async (req: Request, res: Response) => {
  const apiKey = getJulesApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Jules API key is required.' });
  }

  try {
    const sessionId = encodeURIComponent(req.params.id);
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions/${sessionId}:sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send message to Jules', details: err?.message });
  }
});

// Start Express server and attach Vite middleware

  return router;
}
