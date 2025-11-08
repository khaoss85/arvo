/**
 * Utility helpers for Supabase operations
 *
 * NOTE: The `any` type casts are temporary workarounds for database type mismatches.
 * After running the migration, regenerate types with:
 * `supabase gen types typescript --project-ref pttyfxgmmhuhzgwmwser > lib/types/database.ts`
 */

export function prepareInsert<T>(data: T): any {
  return data as any;
}

export function prepareUpdate<T>(data: T): any {
  return data as any;
}

export function prepareUpsert<T>(data: T): any {
  return data as any;
}
