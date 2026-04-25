// src/services/api.js
const API_BASE = 'http://127.0.0.1:8000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(path, { retries = 2, retryDelayMs = 600 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${path}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(formatApiError(payload?.detail));
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Request failed.');
}

export function formatApiError(detail) {
  if (!detail) return 'Failed to fetch recommendations.';
  if (typeof detail === 'string') return detail;
  const message = typeof detail.message === 'string' ? detail.message : 'Request failed.';
  const sample = Array.isArray(detail.sample_user_ids) ? detail.sample_user_ids : [];
  if (sample.length === 0) return message;
  return `${message} Try one of these IDs: ${sample.join(', ')}`;
}

export async function fetchRecommendations(userId, limit = 12) {
  const payload = await requestJson(`/recommend/${encodeURIComponent(userId.trim())}?limit=${limit}`);
  return payload.recommendations || [];
}

export async function fetchSampleUsers(limit = 12) {
  const payload = await requestJson(`/users/sample?limit=${limit}`);
  return Array.isArray(payload?.user_ids) ? payload.user_ids.map(String) : [];
}

export async function fetchMetrics(sampleSize = 100, topK = 10) {
  return requestJson(`/metrics?sample_size=${sampleSize}&top_k=${topK}`);
}

// ── Product Name Generator ─────────────────────────────────────────────────
// Backend returns category_code like "electronics.smartphone" or "apparel.shoes.sport"
export function getProductName(item) {
  const { brand, category } = item;
  if (!category || category === 'unknown_category') {
    return brand ? `${capitalize(brand)} Product` : `Product #${item.product_id}`;
  }
  // Take last meaningful segment from dot-separated category_code
  const parts = category.split('.');
  const typePart = parts[parts.length - 1];
  const parentPart = parts.length >= 2 ? parts[parts.length - 2] : '';
  const typeLabel = capitalize(typePart.replace(/_/g, ' '));
  const parentLabel = parentPart ? capitalize(parentPart.replace(/_/g, ' ')) : '';

  if (brand && brand !== 'no_brand') {
    return `${capitalize(brand)} ${typeLabel}`;
  }
  return parentLabel ? `${parentLabel} ${typeLabel}` : typeLabel;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Category → top-level label (for display & color coding) ───────────────
export function getCategoryLabel(categoryCode) {
  if (!categoryCode) return 'Unknown';
  const topLevel = categoryCode.split('.')[0];
  const map = {
    electronics:   'Electronics',
    apparel:       'Fashion',
    furniture:     'Home',
    appliances:    'Appliances',
    sport:         'Sports',
    kids:          'Kids',
    beauty:        'Beauty',
    accessories:   'Accessories',
    computers:     'Electronics',
    phones:        'Electronics',
    auto:          'Auto',
    garden:        'Garden',
    medicine:      'Health',
    food:          'Food',
    pets:          'Pets',
  };
  return map[topLevel.toLowerCase()] || capitalize(topLevel);
}

// ── Product image: only use real product photos ───────────────────────────
export function getProductImage(item) {
  // Only use real image URLs coming from backend metadata.
  const directUrl = item?.image_url || item?.image || item?.thumbnail || item?.thumbnail_url;
  if (typeof directUrl === 'string' && /^https?:\/\//i.test(directUrl.trim())) {
    return directUrl.trim();
  }

  // No real photo available — return null so the card shows a "No Photo" state.
  return null;
}

// ── Static data ────────────────────────────────────────────────────────────
export const TRENDING_PRODUCTS = [
  { product_id: 'TRD-001', category: 'electronics.smartphone', brand: 'Samsung',   price: 899.99, trend: '+24%' },
  { product_id: 'TRD-002', category: 'apparel.jacket',         brand: 'UrbanWear', price: 129.00, trend: '+18%' },
  { product_id: 'TRD-003', category: 'electronics.laptop',     brand: 'Dell',      price: 1249.00,trend: '+31%' },
  { product_id: 'TRD-004', category: 'sport.shoes',           brand: 'Nike',      price: 249.00, trend: '+15%' },
  { product_id: 'TRD-005', category: 'furniture.sofa',        brand: 'IKEA',      price: 599.00, trend: '+22%' },
  { product_id: 'TRD-006', category: 'beauty.skincare',       brand: 'Loreal',    price:  59.99, trend: '+10%' },
];

export const ALSO_BOUGHT = [
  { product_id: 'ALB-101', category: 'accessories.watch',     brand: 'Fossil',    price:  149.99 },
  { product_id: 'ALB-102', category: 'electronics.headphone', brand: 'Sony',      price:  349.00 },
  { product_id: 'ALB-103', category: 'sport.fitness',         brand: 'FitLife',   price:   89.00 },
  { product_id: 'ALB-104', category: 'appliances.blender',    brand: 'Philips',   price:   99.00 },
];

export const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Appliances', 'Sports', 'Kids', 'Beauty', 'Accessories', 'Auto', 'Health'];
