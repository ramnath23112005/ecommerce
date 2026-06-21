import { Model, Document, FilterQuery } from 'mongoose';

export interface CursorPaginationResult<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export async function cursorPaginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: {
    limit?: number;
    cursorField?: string;
    cursor?: string;
    sortOrder?: 1 | -1;
    populate?: any;
    select?: string;
  } = {}
): Promise<CursorPaginationResult<T>> {
  const limit = options.limit || 20;
  const cursorField = options.cursorField || 'createdAt';
  const sortOrder = options.sortOrder || -1;

  const query: FilterQuery<T> = { ...filter };

  if (options.cursor) {
    const decoded = Buffer.from(options.cursor, 'base64').toString('utf-8');
    const cursorValue = JSON.parse(decoded);
    query[cursorField] = sortOrder === -1 ? { $lt: cursorValue } : { $gt: cursorValue };
  }

  let dbQuery = model.find(query)
    .sort({ [cursorField]: sortOrder, _id: sortOrder } as any)
    .limit(limit + 1);

  if (options.populate) dbQuery = dbQuery.populate(options.populate);
  if (options.select) dbQuery = dbQuery.select(options.select);

  const results = await dbQuery;

  const hasMore = results.length > limit;
  if (hasMore) results.pop();

  let cursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastItem = results[results.length - 1];
    const cursorValue = (lastItem as any)[cursorField];
    cursor = Buffer.from(JSON.stringify(cursorValue)).toString('base64');
  }

  return { data: results, cursor, hasMore };
}
