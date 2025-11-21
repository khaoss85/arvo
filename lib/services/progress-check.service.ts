import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  ProgressCheck,
  ProgressCheckWithPhotos,
  ProgressCheckWithDetails,
  CreateCheckInput,
  CheckComparison,
  PhotoType,
  MeasurementType,
} from '@/lib/types/progress-check.types';

export class ProgressCheckService {
  /**
   * Create a new progress check with photos, measurements, and metadata
   */
  static async createCheck(
    userId: string,
    input: CreateCheckInput,
    photos: { type: PhotoType; file: File }[],
    cycleNumber?: number,
    cycleDay?: number
  ): Promise<ProgressCheck | null> {
    const supabase = getSupabaseBrowserClient();

    try {
      // 1. Create the check record
      const { data: check, error: checkError } = await supabase
        .from('progress_checks')
        .insert({
          user_id: userId,
          weight: input.weight,
          notes: input.notes,
          cycle_number: cycleNumber,
          cycle_day: cycleDay,
          is_milestone: input.isMilestone || false,
          taken_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (checkError || !check) {
        console.error('Failed to create check:', checkError);
        return null;
      }

      const checkWithId = check as { id: string; [key: string]: any };

      // 2. Upload photos to Supabase Storage
      const photoPromises = photos.map(async ({ type, file }, index) => {
        // Create unique file path: userId/checkId/photoType.ext
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${checkWithId.id}/${type}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          console.error(`Failed to upload ${type} photo:`, uploadError);
          return null;
        }

        // Get signed URL for private bucket (valid for 24 hours)
        const { data, error: urlError } = await supabase.storage
          .from('progress-photos')
          .createSignedUrl(fileName, 86400); // 86400 seconds = 24 hours

        if (urlError || !data) {
          console.error(`Failed to create signed URL for ${type} photo:`, urlError);
          return null;
        }

        // Create photo record in database
        const { error: photoError } = await supabase.from('progress_photos').insert({
          check_id: checkWithId.id,
          photo_type: type,
          photo_url: data.signedUrl,
          photo_order: index,
        });

        if (photoError) {
          console.error(`Failed to create ${type} photo record:`, photoError);
          return null;
        }

        return true;
      });

      await Promise.all(photoPromises);

      // 3. Insert body measurements if provided
      if (input.measurements && input.measurements.length > 0) {
        const measurementRecords = input.measurements.map((m) => ({
          check_id: checkWithId.id,
          measurement_type: m.type,
          value: m.value,
        }));

        const { error: measurementError } = await supabase
          .from('body_measurements')
          .insert(measurementRecords);

        if (measurementError) {
          console.error('Failed to insert measurements:', measurementError);
        }
      }

      return checkWithId as any;
    } catch (error) {
      console.error('Error creating check:', error);
      return null;
    }
  }

  /**
   * Get all checks for a user
   */
  static async getChecks(
    userId: string,
    options: {
      limit?: number;
      cycleNumber?: number;
      includeMilestoneOnly?: boolean;
    } = {}
  ): Promise<ProgressCheckWithPhotos[]> {
    const supabase = getSupabaseBrowserClient();
    const { limit = 50, cycleNumber, includeMilestoneOnly = false } = options;

    let query = supabase
      .from('progress_checks')
      .select('*, photos:progress_photos(*)')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false });

    if (cycleNumber !== undefined) {
      query = query.eq('cycle_number', cycleNumber);
    }

    if (includeMilestoneOnly) {
      query = query.eq('is_milestone', true);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch checks:', error);
      return [];
    }

    // Refresh photo URLs for all checks
    const checks = (data || []) as unknown as ProgressCheckWithPhotos[];
    const checksWithRefreshedUrls = await Promise.all(
      checks.map(async (check) => ({
        ...check,
        photos: await this.refreshPhotoUrls(check.photos || []),
      }))
    );

    return checksWithRefreshedUrls;
  }

  /**
   * Get a single check with all details
   */
  static async getCheckById(checkId: string, userId: string): Promise<ProgressCheckWithDetails | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('progress_checks')
      .select('*, photos:progress_photos(*), measurements:body_measurements(*)')
      .eq('id', checkId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch check:', error);
      return null;
    }

    const check = data as unknown as ProgressCheckWithDetails;

    // Refresh photo URLs
    if (check && check.photos) {
      check.photos = await this.refreshPhotoUrls(check.photos);
    }

    return check;
  }

  /**
   * Get the latest check for a user
   */
  static async getLatestCheck(userId: string): Promise<ProgressCheckWithPhotos | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('progress_checks')
      .select('*, photos:progress_photos(*)')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch latest check:', error);
      return null;
    }

    const check = data as unknown as ProgressCheckWithPhotos | null;

    // Refresh photo URLs
    if (check && check.photos) {
      check.photos = await this.refreshPhotoUrls(check.photos);
    }

    return check;
  }

  /**
   * Refresh signed URLs for photos (private helper method)
   * Regenerates signed URLs for an array of photos
   */
  private static async refreshPhotoUrls(photos: any[]): Promise<any[]> {
    if (!photos || photos.length === 0) return photos;

    const supabase = getSupabaseBrowserClient();

    const refreshedPhotos = await Promise.all(
      photos.map(async (photo) => {
        try {
          // Extract file path from existing URL
          // URL format: https://[project].supabase.co/storage/v1/object/sign/progress-photos/[path]?token=...
          const url = new URL(photo.photo_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(sign|public)\/progress-photos\/(.+)/);

          if (!pathMatch || !pathMatch[2]) {
            console.error('Could not extract path from photo URL:', photo.photo_url);
            return photo;
          }

          const filePath = pathMatch[2];

          // Generate new signed URL
          const { data, error } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(filePath, 86400); // 24 hours

          if (error || !data) {
            console.error('Failed to refresh signed URL:', error);
            return photo;
          }

          // Return photo with updated URL
          return {
            ...photo,
            photo_url: data.signedUrl,
          };
        } catch (error) {
          console.error('Error refreshing photo URL:', error);
          return photo;
        }
      })
    );

    return refreshedPhotos;
  }

  /**
   * Get total check count for a user
   */
  static async getCheckCount(userId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient();

    const { count, error } = await supabase
      .from('progress_checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to count checks:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Delete a check and all associated data
   */
  static async deleteCheck(checkId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();

    try {
      // First, get all photos to delete from storage
      const { data: photos } = await supabase
        .from('progress_photos')
        .select('photo_url')
        .eq('check_id', checkId);

      // Delete photos from storage
      if (photos && photos.length > 0) {
        const filePaths = photos.map((p) => {
          // Extract path from URL
          const url = new URL(p.photo_url);
          return url.pathname.split('/storage/v1/object/public/progress-photos/')[1];
        });

        await supabase.storage.from('progress-photos').remove(filePaths);
      }

      // Delete the check (cascade will delete photos and measurements)
      const { error } = await supabase
        .from('progress_checks')
        .delete()
        .eq('id', checkId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete check:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting check:', error);
      return false;
    }
  }

  /**
   * Compare two checks side-by-side
   */
  static async compareChecks(
    beforeCheckId: string,
    afterCheckId: string,
    userId: string
  ): Promise<CheckComparison | null> {
    const supabase = getSupabaseBrowserClient();

    try {
      // Fetch both checks with their data
      const [beforeCheck, afterCheck] = await Promise.all([
        this.getCheckById(beforeCheckId, userId),
        this.getCheckById(afterCheckId, userId),
      ]);

      if (!beforeCheck || !afterCheck) {
        console.error('One or both checks not found');
        return null;
      }

      // Calculate weight difference
      const weightDiff =
        beforeCheck.weight && afterCheck.weight
          ? afterCheck.weight - beforeCheck.weight
          : undefined;

      // Calculate measurement differences
      const measurementDiffs: CheckComparison['measurementDiffs'] = [];
      if (beforeCheck.measurements && afterCheck.measurements) {
        // Group measurements by type
        const beforeMap = new Map(
          beforeCheck.measurements.map((m) => [m.measurement_type, m.value])
        );
        const afterMap = new Map(
          afterCheck.measurements.map((m) => [m.measurement_type, m.value])
        );

        // Compare common measurements
        const allTypes = new Set([...Array.from(beforeMap.keys()), ...Array.from(afterMap.keys())]);
        allTypes.forEach((type) => {
          const beforeValue = beforeMap.get(type);
          const afterValue = afterMap.get(type);
          measurementDiffs.push({
            type: type as MeasurementType,
            beforeValue,
            afterValue,
            diff:
              beforeValue && afterValue ? afterValue - beforeValue : undefined,
          });
        });
      }

      // Calculate days between
      const daysBetween = Math.floor(
        (new Date(afterCheck.taken_at).getTime() -
          new Date(beforeCheck.taken_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        before: beforeCheck as ProgressCheckWithPhotos,
        after: afterCheck as ProgressCheckWithPhotos,
        weightDiff,
        measurementDiffs,
        daysBetween,
      };
    } catch (error) {
      console.error('Error comparing checks:', error);
      return null;
    }
  }

  /**
   * Get checks grouped by cycle
   */
  static async getChecksByCycle(userId: string): Promise<
    {
      cycleNumber: number;
      checks: ProgressCheckWithPhotos[];
    }[]
  > {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('progress_checks')
      .select('*, photos:progress_photos(*)')
      .eq('user_id', userId)
      .not('cycle_number', 'is', null)
      .order('cycle_number', { ascending: false })
      .order('taken_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch checks by cycle:', error);
      return [];
    }

    const checks = (data || []) as unknown as ProgressCheckWithPhotos[];

    // Refresh photo URLs for all checks
    const checksWithRefreshedUrls = await Promise.all(
      checks.map(async (check) => ({
        ...check,
        photos: await this.refreshPhotoUrls(check.photos || []),
      }))
    );

    // Group by cycle number
    const cycleMap = new Map<number, ProgressCheckWithPhotos[]>();
    checksWithRefreshedUrls.forEach((check) => {
      if (check.cycle_number !== null) {
        const existing = cycleMap.get(check.cycle_number) || [];
        cycleMap.set(check.cycle_number, [...existing, check]);
      }
    });

    // Convert to array and sort
    return Array.from(cycleMap.entries())
      .map(([cycleNumber, checks]) => ({ cycleNumber, checks }))
      .sort((a, b) => b.cycleNumber - a.cycleNumber);
  }
}
