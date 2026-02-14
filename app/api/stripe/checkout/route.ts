import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, priceId, quoteId, amount, description } = body;

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Common session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/membership`,
      metadata: {
        user_id: user.id,
        type: type,
      },
    };

    if (type === 'subscription') {
      // Gold Membership Subscription
      const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        mode: 'subscription',
        line_items: [
          {
            price: priceId || await createGoldMembershipPrice(),
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan: 'gold',
          },
        },
        success_url: `${origin}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } else if (type === 'quote_payment') {
      // Quote Payment (One-time)
      const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description || 'Service Quote',
                images: [`${origin}/autopilot.png`],
              },
              unit_amount: amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          ...sessionParams.metadata,
          quote_id: quoteId,
        },
        success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&quote_id=${quoteId}`,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Helper function to create or get Gold Membership price
async function createGoldMembershipPrice(): Promise<string> {
  // Check if price already exists
  const prices = await stripe.prices.list({
    product: await getOrCreateGoldProduct(),
    active: true,
    limit: 1,
  });

  if (prices.data.length > 0) {
    return prices.data[0].id;
  }

  // Create new price
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1900, // $19.00
    recurring: {
      interval: 'month',
    },
    product: await getOrCreateGoldProduct(),
  });

  return price.id;
}

async function getOrCreateGoldProduct(): Promise<string> {
  // Check if product exists
  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  const existingProduct = products.data.find(
    (p) => p.name === 'Autopilot Gold Membership'
  );

  if (existingProduct) {
    return existingProduct.id;
  }

  // Create product
  const product = await stripe.products.create({
    name: 'Autopilot Gold Membership',
    description: '5% cash back in CarCoins, Priority AI Chat, Automatic Scheduling',
    images: ['https://autopilot.app/autopilot.png'], // Update with your domain
    metadata: {
      type: 'subscription',
      plan: 'gold',
    },
  });

  return product.id;
}
