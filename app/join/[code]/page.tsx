import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await getSupabaseServerClient();

  // Validate referral code exists
  const { data: referrer } = await supabase
    .from('waitlist_entries')
    .select('id, first_name, referral_code')
    .eq('referral_code', code.toUpperCase())
    .single();

  // If code is valid, redirect to homepage with ref param
  // If invalid, redirect to homepage without ref (user can still sign up organically)
  if (referrer) {
    redirect(`/?ref=${code.toUpperCase()}`);
  } else {
    redirect('/');
  }
}
