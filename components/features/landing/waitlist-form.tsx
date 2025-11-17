'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, Check, Loader2, Trophy, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface WaitlistFormProps {
  inline?: boolean; // If true, renders in compact inline mode
}

export function WaitlistForm({ inline = false }: WaitlistFormProps) {
  const searchParams = useSearchParams();
  const referrerCode = searchParams?.get('ref') || '';

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [entry, setEntry] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          referrerCode: referrerCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setEntry(data.entry);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  const shareReferralUrl = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ARVO AI Training',
          text: `Join me on ARVO - AI Personal Trainer for serious lifters! Use my code to skip the line.`,
          url,
        });
      } catch (err) {
        // User cancelled share or error occurred
        copyReferralUrl(url);
      }
    } else {
      copyReferralUrl(url);
    }
  };

  if (success && entry) {
    const referralUrl = `${window.location.origin}/join/${entry.referralCode}`;
    const isInstantAccess = entry.queuePosition === null;
    const isTopBoost = entry.queuePosition && entry.queuePosition <= 50;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
          inline ? 'p-6' : 'p-8 max-w-2xl mx-auto'
        }`}
      >
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30"
          >
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isInstantAccess ? "You're In! 🎉" : "You're on the list!"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isInstantAccess
                ? "You've unlocked instant access by inviting friends!"
                : entry.alreadyExists
                ? "You've already joined the waitlist"
                : "Thanks for joining the waitlist"}
            </p>
          </div>

          {/* Queue Position */}
          {!isInstantAccess && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
              <div className="flex items-center justify-center gap-3 mb-2">
                {isTopBoost && <Trophy className="w-6 h-6 text-amber-500" />}
                <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  #{entry.queuePosition}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isTopBoost ? "You're in the top 50! 🔥" : 'Your position in line'}
              </p>
            </div>
          )}

          {/* Referral Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {entry.invitedCount}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Friends invited</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.max(0, 5 - entry.invitedCount)}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                More for instant access
              </p>
            </div>
          </div>

          {/* Progression Milestones */}
          {!isInstantAccess && (
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    entry.invitedCount >= 3
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {entry.invitedCount >= 3 && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Invite 3 friends → Jump to top 50
                  {entry.invitedCount >= 3 && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                      ✓ Unlocked!
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    entry.invitedCount >= 5
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {entry.invitedCount >= 5 && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Invite 5 friends → Instant access + Audio Coaching unlock
                </span>
              </div>
            </div>
          )}

          {/* Referral Link */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share your unique link:
            </p>

            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="bg-gray-50 dark:bg-gray-900 text-sm"
                onClick={(e) => {
                  e.currentTarget.select();
                  copyReferralUrl(referralUrl);
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareReferralUrl(referralUrl)}
                className="shrink-0"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Every friend who joins moves you up the list
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${inline ? 'max-w-md mx-auto' : 'max-w-lg mx-auto'}`}
    >
      {referrerCode && (
        <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-3 border border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            <Users className="inline w-4 h-4 mr-1" />
            You've been invited! Join now to skip the line.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-12 text-base"
        />

        <Input
          type="text"
          placeholder="First name (optional)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
          className="h-12 text-base"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-base"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          'Join the Waitlist'
        )}
      </Button>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-600 dark:text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        No spam, ever. Unsubscribe anytime.
      </p>
    </motion.form>
  );
}
