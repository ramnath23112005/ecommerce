import crypto from 'crypto';

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generateSKU = (productName: string, variant: string): string => {
  const prefix = productName.substring(0, 3).toUpperCase();
  const variantCode = variant.substring(0, 4).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${variantCode}-${random}`;
};

export const generateCouponCode = (length = 8): string => {
  return crypto.randomBytes(length).toString('hex').toUpperCase().substring(0, length);
};

export const generateToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const sanitizeHtml = (str: string): string => {
  return str.replace(/[&<>"']/g, (char: string) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return entities[char] || char;
  });
};

export const parseQueryFilters = (query: Record<string, any>) => {
  const filters: Record<string, any> = {};
  const excludeFields = ['page', 'limit', 'sort', 'fields', 'q', 'search'];

  for (const [key, value] of Object.entries(query)) {
    if (excludeFields.includes(key)) continue;
    if (key.endsWith('[gte]')) filters[key.replace('[gte]', '')] = { $gte: value };
    else if (key.endsWith('[gt]')) filters[key.replace('[gt]', '')] = { $gt: value };
    else if (key.endsWith('[lte]')) filters[key.replace('[lte]', '')] = { $lte: value };
    else if (key.endsWith('[lt]')) filters[key.replace('[lt]', '')] = { $lt: value };
    else if (key.endsWith('[in]')) filters[key.replace('[in]', '')] = { $in: value.split(',') };
    else if (key.endsWith('[nin]')) filters[key.replace('[nin]', '')] = { $nin: value.split(',') };
    else filters[key] = value;
  }
  return filters;
};
