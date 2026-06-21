import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import logger from '../utils/logger';

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({ node: config.elasticsearch.url });
  }
  return client;
}

export async function ensureIndex(index: string, mappings: Record<string, any>): Promise<void> {
  const es = getClient();
  const exists = await es.indices.exists({ index });
  if (!exists) {
    await es.indices.create({ index, mappings } as any);
    logger.info(`[Search] Created index: ${index}`);
  }
}

export async function indexDocument(index: string, id: string, document: Record<string, any>): Promise<void> {
  try {
    const es = getClient();
    await es.index({ index, id, document, refresh: 'wait_for' } as any);
  } catch (error) {
    logger.error(`[Search] Failed to index ${index}/${id}:`, error);
  }
}

export async function bulkIndex(index: string, documents: Array<{ id: string; body: Record<string, any> }>): Promise<void> {
  try {
    const es = getClient();
    const body = documents.flatMap((doc) => [{ index: { _index: index, _id: doc.id } }, doc.body]);
    await es.bulk({ body, refresh: 'wait_for' } as any);
  } catch (error) {
    logger.error(`[Search] Bulk index failed for ${index}:`, error);
  }
}

export async function deleteDocument(index: string, id: string): Promise<void> {
  try {
    const es = getClient();
    await es.delete({ index, id });
  } catch (error) {
    logger.error(`[Search] Failed to delete ${index}/${id}:`, error);
  }
}

export async function searchProducts(query: {
  q?: string;
  category?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  tags?: string[];
  sort?: string;
  page?: number;
  limit?: number;
  attributes?: Record<string, string>;
}): Promise<{ hits: any[]; total: number }> {
  const es = getClient();
  const must: any[] = [];
  const filter: any[] = [];

  if (query.q) {
    must.push({
      multi_match: {
        query: query.q,
        fields: ['name^3', 'description', 'brand^2', 'tags', 'categoryName'],
        fuzziness: 'AUTO',
      },
    });
  }

  if (query.category) filter.push({ term: { category: query.category } });
  if (query.seller) filter.push({ term: { seller: query.seller } });
  if (query.minPrice || query.maxPrice) {
    const range: any = {};
    if (query.minPrice) range.gte = query.minPrice;
    if (query.maxPrice) range.lte = query.maxPrice;
    filter.push({ range: { 'minPrice': range } });
  }
  if (query.rating) filter.push({ range: { averageRating: { gte: query.rating } } });
  if (query.tags?.length) filter.push({ terms: { tags: query.tags } });
  if (query.attributes) {
    for (const [key, value] of Object.entries(query.attributes)) {
      filter.push({ term: { [`attributes.${key}`]: value } });
    }
  }

  let sort: any[] = [{ _score: 'desc' }];
  if (query.sort) {
    switch (query.sort) {
      case 'price_asc': sort = [{ minPrice: 'asc' }]; break;
      case 'price_desc': sort = [{ minPrice: 'desc' }]; break;
      case 'newest': sort = [{ createdAt: 'desc' }]; break;
      case 'rating': sort = [{ averageRating: 'desc' }]; break;
      case 'sales': sort = [{ totalSales: 'desc' }]; break;
    }
  }

  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);

  const result = await es.search({
    index: 'products',
    query: { bool: { must: must.length ? must : [{ match_all: {} }], filter } },
    sort,
    from: (page - 1) * limit,
    size: limit,
    aggs: {
      categories: { terms: { field: 'category', size: 20 } },
      price_range: { range: { field: 'minPrice', ranges: [{ to: 25 }, { from: 25, to: 50 }, { from: 50, to: 100 }, { from: 100 }] } },
      avg_rating: { avg: { field: 'averageRating' } },
    },
  });

  const hits = ((result as any).hits?.hits || []).map((h: any) => ({
    _id: h._id,
    _score: h._score,
    ...h._source,
  }));

  const totalHits = (result as any).hits?.total;
  const total = typeof totalHits === 'object' ? totalHits.value : (totalHits || 0);

  return { hits, total };
}

export async function getSuggestions(prefix: string): Promise<string[]> {
  try {
    const es = getClient();
    const result = await es.search({
      index: 'products',
      suggest: {
        product_suggest: {
          prefix,
          completion: { field: 'suggest', size: 5, fuzzy: { fuzziness: 2 } },
        },
      },
    });

    const suggestions = (result as any).suggest?.product_suggest?.[0]?.options || [];
    return suggestions.map((s: any) => s.text);
  } catch (error) {
    logger.error('[Search] Suggestions failed:', error);
    return [];
  }
}

export async function initializeSearchIndices(): Promise<void> {
  await ensureIndex('products', {
    properties: {
      name: { type: 'text', analyzer: 'standard' },
      slug: { type: 'keyword' },
      description: { type: 'text', analyzer: 'standard' },
      category: { type: 'keyword' },
      categoryName: { type: 'text' },
      seller: { type: 'keyword' },
      sellerName: { type: 'text' },
      brand: { type: 'text' },
      tags: { type: 'keyword' },
      minPrice: { type: 'float' },
      maxPrice: { type: 'float' },
      averageRating: { type: 'float' },
      numReviews: { type: 'integer' },
      status: { type: 'keyword' },
      attributes: { type: 'object', enabled: true },
      totalSales: { type: 'integer' },
      isFeatured: { type: 'boolean' },
      createdAt: { type: 'date' },
      suggest: { type: 'completion' },
    },
  });

  logger.info('[Search] Indices initialized');
}
