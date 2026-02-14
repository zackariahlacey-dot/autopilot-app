import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = await createClient();
  const userId = session.metadata?.user_id;
  const type = session.metadata?.type;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  console.log(`Checkout complete for user ${userId}, type: ${type}`);

  if (type === 'subscription') {
    // Update user to Gold status
    const { error } = await supabase
      .from('users')
      .update({
        is_gold: true,
        gold_subscribed_at: new Date().toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user Gold status:', error);
    } else {
      console.log(`User ${userId} upgraded to Gold!`);
      
      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'gold_upgrade',
        title: 'Welcome to Autopilot Gold! 🚀',
        message: 'You now have access to 5% CarCoins cash back, Priority AI Chat, and Automatic Scheduling!',
        action_url: '/membership',
      });
    }
  } else if (type === 'quote_payment') {
    // Handle quote payment
    const quoteId = session.metadata?.quote_id;
    
    if (quoteId) {
      // Update quote status to paid
      await supabase
        .from('marketplace_quotes')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', quoteId);

      console.log(`Quote ${quoteId} marked as paid`);
    }
  }

  // Record transaction
  await supabase.from('transactions').insert({
    user_id: userId,
    amount: session.amount_total || 0,
    service_name: type === 'subscription' ? 'Autopilot Gold Membership' : 'Service Payment',
    transaction_type: type === 'subscription' ? 'subscription' : 'service',
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string,
    completed_at: new Date().toISOString(),
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const userId = subscription.metadata?.user_id;

  if (!userId) return;

  const isActive = subscription.status === 'active';

  await supabase
    .from('users')
    .update({
      is_gold: isActive,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
    })
    .eq('id', userId);

  console.log(`Subscription ${subscription.id} updated to ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const userId = subscription.metadata?.user_id;

  if (!userId) return;

  await supabase
    .from('users')
    .update({
      is_gold: false,
      subscription_status: 'canceled',
    })
    .eq('id', userId);

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'subscription_canceled',
    title: 'Gold Membership Canceled',
    message: 'Your Autopilot Gold membership has been canceled. You still have access until the end of your billing period.',
    action_url: '/membership',
  });

  console.log(`Subscription ${subscription.id} canceled for user ${userId}`);
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
  // Get user_id from subscription metadata if subscription exists
  const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
  const subscriptionId = typeof invoiceWithSub.subscription === 'string' ? invoiceWithSub.subscription : invoiceWithSub.subscription?.id;
  if (!subscriptionId) return;
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (!userId) return;

  // Record the recurring payment
  await supabase.from('transactions').insert({
    user_id: userId,
    amount: invoice.amount_paid,
    service_name: 'Autopilot Gold - Monthly',
    transaction_type: 'subscription',
    stripe_invoice_id: invoice.id,
    completed_at: new Date().toISOString(),
  });

  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
  // Get user_id from subscription metadata if subscription exists
  const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
  const subscriptionId = typeof invoiceWithSub.subscription === 'string' ? invoiceWithSub.subscription : invoiceWithSub.subscription?.id;
  if (!subscriptionId) return;
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (!userId) return;

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payment_failed',
    title: 'Payment Failed',
    message: 'Your Gold membership payment failed. Please update your payment method to avoid service interruption.',
    action_url: '/membership',
  });

  console.log(`Payment failed for invoice ${invoice.id}`);
}
