'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upgradeSubscription(tier: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Simulate Stripe subscription creation
    // In production, you would:
    // 1. Create Stripe checkout session
    // 2. Redirect to Stripe
    // 3. Handle webhook for successful payment
    // 4. Update subscription in database

    // For now, just update the subscription directly (simulation)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        tier: tier,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return { success: false, error: 'Failed to update subscription' };
    }

    // Award bonus CarCoins for upgrading
    const bonusAmount = tier === 'gold' ? 1000 : tier === 'platinum' ? 2500 : 0; // 10 or 25 coins

    if (bonusAmount > 0) {
      await supabase
        .from('user_wallets')
        .update({
          balance: supabase.rpc('increment', { x: bonusAmount }),
          lifetime_earned: supabase.rpc('increment', { x: bonusAmount }),
        })
        .eq('user_id', user.id);

      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: bonusAmount,
          type: 'loyalty_reward',
          description: `Welcome to Autopilot ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Bonus CarCoins.`,
        });
    }

    revalidatePath('/membership');
    revalidatePath('/dashboard');
    revalidatePath('/garage');

    return { success: true };
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function cancelSubscription() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return { success: false, error: 'Failed to cancel subscription' };
    }

    revalidatePath('/membership');

    return { success: true };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
