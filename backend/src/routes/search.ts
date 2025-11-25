import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Global search endpoint
router.get('/', async (req: Request, res: Response) => {
  const qRaw = req.query.q;
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';

  // If no query provided, return empty results for a graceful response
  if (!q) {
    return res.status(200).json({ results: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { materials: { contains: q, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: { contains: q, mode: 'insensitive' },
              },
            },
          },
        ],
      },
      take: 20,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: true,
        tags: true,
      },
    });

    return res.json({ results: products });
  } catch (error: any) {
    logger.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions endpoint
router.get('/suggestions', async (req: Request, res: Response) => {
  const qRaw = req.query.q;
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';

  if (!q) {
    return res.json({ suggestions: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      select: { name: true },
      take: 10,
    });

    const suggestions = Array.from(new Set(products.map((p) => p.name))).slice(0, 10);

    return res.json({ suggestions });
  } catch (error: any) {
    logger.error('Search suggestions error:', error);
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;