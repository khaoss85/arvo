import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUser, isGymOwner } from "@/lib/utils/auth.server";
import { createGymSchema } from "@/lib/types/gym.types";

export async function POST(request: NextRequest) {
  // Check if user can create a gym (gym_owner or admin role)
  const canCreate = await isGymOwner();
  if (!canCreate) {
    return NextResponse.json(
      { error: "Forbidden - Gym owner or admin role required" },
      { status: 403 }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const result = createGymSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, email, phone, website } = result.data;

    const supabase = await getSupabaseServerClient();

    // Check if user already owns a gym
    const { data: existingGym } = await supabase
      .from("gyms")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (existingGym) {
      return NextResponse.json(
        { error: "You already own a gym" },
        { status: 400 }
      );
    }

    // Create gym using the database function
    const { data: gymId, error } = await supabase.rpc("create_gym_with_branding", {
      p_owner_id: user.id,
      p_name: name,
      p_email: email || undefined,
      p_logo_url: undefined,
      p_primary_color: "221 83% 53%", // Default primary color
    });

    if (error) {
      console.error("[Gym Create] Error:", error);
      return NextResponse.json(
        { error: "Failed to create gym" },
        { status: 500 }
      );
    }

    // Update additional fields if provided
    if (description || phone || website) {
      const updateData: Record<string, string> = {};
      if (description) updateData.description = description;
      if (phone) updateData.phone = phone;
      if (website) updateData.website = website;

      await supabase
        .from("gyms")
        .update(updateData)
        .eq("id", gymId);
    }

    // Fetch the created gym
    const { data: gym } = await supabase
      .from("gyms")
      .select("id, name, slug, invite_code")
      .eq("id", gymId)
      .single();

    return NextResponse.json({
      success: true,
      gym,
    });
  } catch (error) {
    console.error("[Gym Create] Error:", error);
    return NextResponse.json(
      { error: "Failed to create gym" },
      { status: 500 }
    );
  }
}
