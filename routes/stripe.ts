import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const getStripe = () =>
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })
    : null;

// Checkout exige usuário autenticado — o tenant vem do token, nunca do body
router.post('/create-checkout-session', authMiddleware, async (req, res): Promise<any> => {
  const { priceId } = req.body;
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Contexto de tenant necessário' });

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Billing não configurado (STRIPE_SECRET_KEY ausente)' });
    }

    // Mapeamento dos Planos (Growth, Business, Enterprise)
    let productName = 'Plano Customizado';
    let unitAmount = 0;
    let planKey = 'starter';

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
    } else {
      return res.status(400).json({ error: 'Plano desconhecido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
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
      metadata: { tenantId, userId: userId ?? '', plan: planKey },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook do Stripe — assinatura SEMPRE verificada; sem segredo configurado,
// o endpoint recusa (nunca processa eventos não verificados)
router.post('/webhook', async (req, res): Promise<any> => {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !endpointSecret) {
    console.error('Stripe webhook chamado sem STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET configurados.');
    return res.status(503).json({ error: 'Webhook não configurado' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      const purchasedPlan = session.metadata?.plan || 'growth';

      if (tenantId) {
        console.log(`Checkout completed for tenant ${tenantId}. Upgrading to plan: ${purchasedPlan}`);
        try {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: purchasedPlan }
          });
        } catch (e) {
          console.error(`Failed to update tenant ${tenantId} in DB:`, e);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      if (tenantId) {
        try {
          await prisma.tenant.update({ where: { id: tenantId }, data: { plan: 'starter' } });
          console.log(`Assinatura cancelada — tenant ${tenantId} rebaixado para starter.`);
        } catch (e) {
          console.error(`Failed to downgrade tenant ${tenantId}:`, e);
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

export default router;
