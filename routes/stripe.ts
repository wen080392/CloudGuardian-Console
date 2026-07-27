import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import express from 'express';

const router = Router();

router.post('/create-checkout-session', async (req, res) => {
  const { priceId, tenantId, userId } = req.body;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.warn('Tenant not found, but allowing checkout to proceed for testing.');
    }
    
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
      
      // Mapeamento dos Planos (Growth, Business, Enterprise)
      let productName = 'Plano Customizado';
      let unitAmount = 0;
      let planKey = 'free';

      if (priceId === 'price_growth' || priceId === process.env.STRIPE_PRICE_GROWTH) {
        productName = 'Plano Growth';
        unitAmount = 49900; // $499.00
        planKey = 'growth';
      } else if (priceId === 'price_business' || priceId === process.env.STRIPE_PRICE_BUSINESS) {
        productName = 'Plano Business';
        unitAmount = 129900; // $1,299.00
        planKey = 'business';
      } else if (priceId === 'price_enterprise' || priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
        productName = 'Plano Enterprise';
        unitAmount = 500000; // $5,000.00
        planKey = 'enterprise';
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd', // B2B SaaS generally uses USD
              product_data: { name: productName },
              unit_amount: unitAmount,
              recurring: { interval: 'month' }
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
        metadata: { tenantId, userId, plan: planKey },
      });
      res.json({ sessionId: session.id, url: session.url });
    } else {
      // Mock Stripe
      console.log('Stripe Mock Checkout for:', priceId);
      res.json({ sessionId: 'mock-session-id', url: '/success' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook for stripe
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' }) : null;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (stripe && endpointSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Mock processing
    event = req.body;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const tenantId = session.metadata?.tenantId;
      const purchasedPlan = session.metadata?.plan || 'growth';
      
      if (tenantId) {
        console.log(`Checkout completed for tenant ${tenantId}. Upgrading to plan: ${purchasedPlan}`);
        try {
          await prisma.tenant.update({ 
            where: { id: tenantId }, 
            data: { plan: purchasedPlan } 
          });
          console.log(`Tenant ${tenantId} updated successfully in DB.`);
        } catch (e) {
          console.error(`Failed to update tenant ${tenantId} in DB:`, e);
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

export default router;
