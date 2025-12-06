import { NextRequest, NextResponse } from "next/server";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

// Helper to get relationship ID
async function getRelationshipId(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, coachId: string, clientId: string) {
  const { data: relationship, error } = await supabase
    .from("coach_client_relationships")
    .select("id")
    .eq("coach_id", coachId)
    .eq("client_id", clientId)
    .eq("status", "active")
    .single();

  if (error || !relationship) {
    return null;
  }
  return relationship.id;
}

// GET - List all notes for a client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const supabase = await getSupabaseServerClient();

    const relationshipId = await getRelationshipId(supabase, user.id, clientId);
    if (!relationshipId) {
      return NextResponse.json(
        { error: "Client relationship not found" },
        { status: 404 }
      );
    }

    const { data: notes, error } = await supabase
      .from("coach_client_notes")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error("[API] Error in GET /api/coach/clients/[clientId]/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await request.json();
    const { content, isShared = false } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    const relationshipId = await getRelationshipId(supabase, user.id, clientId);
    if (!relationshipId) {
      return NextResponse.json(
        { error: "Client relationship not found" },
        { status: 404 }
      );
    }

    const { data: note, error } = await supabase
      .from("coach_client_notes")
      .insert({
        relationship_id: relationshipId,
        content: content.trim(),
        is_shared: Boolean(isShared),
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating note:", error);
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[API] Error in POST /api/coach/clients/[clientId]/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing note
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await request.json();
    const { noteId, content, isShared } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Content is required unless we're only updating isShared
    const hasContent = content !== undefined;
    const hasIsShared = isShared !== undefined;

    if (hasContent && (typeof content !== "string" || content.trim() === "")) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 }
      );
    }

    if (!hasContent && !hasIsShared) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    const relationshipId = await getRelationshipId(supabase, user.id, clientId);
    if (!relationshipId) {
      return NextResponse.json(
        { error: "Client relationship not found" },
        { status: 404 }
      );
    }

    // Verify the note belongs to this relationship
    const { data: existingNote, error: fetchError } = await supabase
      .from("coach_client_notes")
      .select("id")
      .eq("id", noteId)
      .eq("relationship_id", relationshipId)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (hasContent) updateData.content = content.trim();
    if (hasIsShared) updateData.is_shared = Boolean(isShared);

    const { data: note, error } = await supabase
      .from("coach_client_notes")
      .update(updateData)
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating note:", error);
      return NextResponse.json(
        { error: "Failed to update note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[API] Error in PATCH /api/coach/clients/[clientId]/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    const relationshipId = await getRelationshipId(supabase, user.id, clientId);
    if (!relationshipId) {
      return NextResponse.json(
        { error: "Client relationship not found" },
        { status: 404 }
      );
    }

    // Verify the note belongs to this relationship before deleting
    const { error } = await supabase
      .from("coach_client_notes")
      .delete()
      .eq("id", noteId)
      .eq("relationship_id", relationshipId);

    if (error) {
      console.error("[API] Error deleting note:", error);
      return NextResponse.json(
        { error: "Failed to delete note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/coach/clients/[clientId]/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
