/**
 * Schema Validators
 *
 * Robust Zod schemas with validation and transformation for eBay data.
 * Ensures data integrity and provides type-safe extraction.
 */

import { z } from 'zod';

/**
 * Price schema with validation and automatic parsing
 */
export const PriceSchema = z.string()
  .min(1, 'Price cannot be empty')
  .transform(val => {
    // Extract numeric value from price string (e.g., "$299.99" -> 299.99)
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    const numeric = parseFloat(cleaned);

    if (isNaN(numeric) || numeric < 0) {
      // Return raw value if parsing fails - don't throw to allow LLM flexibility
      return {
        raw: val,
        numeric: 0,
        formatted: val,
        valid: false
      };
    }

    return {
      raw: val,
      numeric: numeric,
      formatted: `$${numeric.toFixed(2)}`,
      valid: true
    };
  });

/**
 * Product condition enum
 */
export const ConditionSchema = z.enum([
  'New',
  'Used',
  'Refurbished',
  'For Parts',
  'Open Box',
  'Certified Refurbished',
  'Pre-Owned',
  'Like New'
]).optional();

/**
 * Seller rating schema with validation
 */
export const SellerRatingSchema = z.string()
  .transform(val => {
    // Extract percentage from rating (e.g., "98.5%" -> 98.5)
    const match = val.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return {
        raw: val,
        numeric: 0,
        isGood: false,
        valid: false
      };
    }

    const numeric = parseFloat(match[1]);
    return {
      raw: val,
      numeric: numeric,
      isGood: numeric >= 98,
      isExcellent: numeric >= 99,
      valid: true
    };
  })
  .optional();

/**
 * Image URL schema with validation
 */
export const ImageUrlSchema = z.string()
  .url('Invalid image URL')
  .refine(
    url => /\.(jpg|jpeg|png|webp|gif)/i.test(url),
    'URL must point to an image file'
  )
  .optional()
  .catch(undefined); // Return undefined if validation fails

/**
 * Shipping schema with parsing
 */
export const ShippingSchema = z.string()
  .transform(val => {
    const isFree = /free|gratis|no cost/i.test(val);
    const priceMatch = val.match(/\$?([\d.,]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

    return {
      raw: val,
      isFree,
      price: isFree ? 0 : price,
      formatted: isFree ? 'Free Shipping' : val,
      valid: isFree || price !== null
    };
  })
  .optional();

/**
 * Seller information schema
 */
export const SellerSchema = z.object({
  name: z.string().min(1, 'Seller name required'),
  rating: SellerRatingSchema,
  topRated: z.boolean().optional(),
  feedbackCount: z.number().optional(),
  location: z.string().optional()
}).optional();

/**
 * Complete product schema with all fields
 */
export const ProductSchema = z.object({
  title: z.string()
    .min(1, 'Product title is required')
    .max(500, 'Product title too long'),
  price: PriceSchema,
  condition: ConditionSchema,
  shipping: ShippingSchema,
  imageUrl: ImageUrlSchema,
  seller: SellerSchema,
  description: z.string().optional(),
  itemNumber: z.string().optional(),
  location: z.string().optional(),
  watchers: z.number().optional(),
  available: z.number().optional()
});

/**
 * Schema for multiple products (search results)
 */
export const ProductListSchema = z.object({
  products: z.array(ProductSchema),
  totalResults: z.number().optional(),
  currentPage: z.number().optional()
});

/**
 * Schema for product with additional metadata
 */
export const EnrichedProductSchema = ProductSchema.extend({
  score: z.number().optional(),
  pricePerformance: z.string().optional(),
  dealQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
});

// Export types for TypeScript inference
export type Price = z.infer<typeof PriceSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type SellerRating = z.infer<typeof SellerRatingSchema>;
export type Shipping = z.infer<typeof ShippingSchema>;
export type Seller = z.infer<typeof SellerSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;
export type EnrichedProduct = z.infer<typeof EnrichedProductSchema>;

/**
 * Helper function to create custom product schema with optional fields
 */
export function createProductSchema(fields: Partial<Record<keyof Product, boolean>>) {
  const baseSchema: any = {
    title: z.string().min(1)
  };

  if (fields.price) baseSchema.price = PriceSchema;
  if (fields.condition) baseSchema.condition = ConditionSchema;
  if (fields.shipping) baseSchema.shipping = ShippingSchema;
  if (fields.imageUrl) baseSchema.imageUrl = ImageUrlSchema;
  if (fields.seller) baseSchema.seller = SellerSchema;
  if (fields.description) baseSchema.description = z.string().optional();
  if (fields.itemNumber) baseSchema.itemNumber = z.string().optional();
  if (fields.location) baseSchema.location = z.string().optional();
  if (fields.watchers) baseSchema.watchers = z.number().optional();
  if (fields.available) baseSchema.available = z.number().optional();

  return z.object(baseSchema);
}
