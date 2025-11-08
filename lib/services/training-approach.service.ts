import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertTrainingApproachSchema,
  updateTrainingApproachSchema,
  type TrainingApproach,
  type InsertTrainingApproach,
  type UpdateTrainingApproach,
} from "@/lib/types/schemas";

export class TrainingApproachService {
  /**
   * Get all training approaches (client-side)
   */
  static async getAll(): Promise<TrainingApproach[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("training_approaches")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch training approaches: ${error.message}`);
    }

    return data as TrainingApproach[];
  }

  /**
   * Get training approach by ID (client-side)
   */
  static async getById(id: string): Promise<TrainingApproach | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("training_approaches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch training approach: ${error.message}`);
    }

    return data as TrainingApproach;
  }

  /**
   * Create new training approach (client-side)
   */
  static async create(approach: InsertTrainingApproach): Promise<TrainingApproach> {
    const validated = insertTrainingApproachSchema.parse(approach);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("training_approaches")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create training approach: ${error.message}`);
    }

    return data as TrainingApproach;
  }

  /**
   * Update training approach (client-side)
   */
  static async update(
    id: string,
    approach: UpdateTrainingApproach
  ): Promise<TrainingApproach> {
    const validated = updateTrainingApproachSchema.parse(approach);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("training_approaches")
      // @ts-ignore
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update training approach: ${error.message}`);
    }

    return data as TrainingApproach;
  }

  /**
   * Delete training approach (client-side)
   */
  static async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("training_approaches")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete training approach: ${error.message}`);
    }
  }

  /**
   * Get all training approaches (server-side)
   */
  static async getAllServer(): Promise<TrainingApproach[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("training_approaches")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch training approaches: ${error.message}`);
    }

    return data as TrainingApproach[];
  }
}
