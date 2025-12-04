import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin, getUser } from '@/lib/utils/auth.server';

const VALID_ROLES = ['user', 'coach', 'gym_owner', 'admin'] as const;
type UserRole = (typeof VALID_ROLES)[number];

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  const { userId } = await params;
  const currentUser = await getUser();

  // Prevent self-role change (safety measure)
  if (currentUser?.id === userId) {
    return NextResponse.json(
      { error: 'Cannot change your own role' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Update user role
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('[Admin] Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      role,
    });
  } catch (error) {
    console.error('[Admin] Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
