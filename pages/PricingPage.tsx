import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Check, X, Sparkles } from 'lucide-react';
import { apiClient } from '../lib/api/client';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_123');

const plans = [
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    description: 'Para startups em crescimento',
    features: [
      { name: 'Até 1.000 recursos monitorados', included: true },
      { name: 'Scans de IaC ilimitados', included: true },
      { name: 'Alertas Slack / Email', included: true },
      { name: 'Drift Detection', included: true },
      { name: 'Auto-Fix PR', included: true },
      { name: 'FinOps (Análise de custos)', included: false },
      { name: 'Relatórios SOC2/CIS', included: false },
      { name: 'Políticas OPA customizadas', included: false },
    ],
    popular: true,
    priceId: 'price_pro_monthly',
  },
  {
    id: 'business',
    name: 'Business',
    price: 1499,
    description: 'Para médias empresas',
    features: [
      { name: 'Até 5.000 recursos', included: true },
      { name: 'Scans ilimitados', included: true },
      { name: 'Alertas Slack / Teams / Email', included: true },
      { name: 'Drift Detection', included: true },
      { name: 'Auto-Fix PR', included: true },
      { name: 'FinOps (Análise de custos)', included: true },
      { name: 'Relatórios SOC2/CIS (PDF)', included: true },
      { name: 'Políticas OPA customizadas', included: true },
      { name: 'Integração com Jira/ServiceNow', included: true },
      { name: 'SLA 99.9%', included: true },
    ],
    priceId: 'price_business_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'Para grandes corporações',
    features: [
      { name: 'Recursos ilimitados', included: true },
      { name: 'Scans ilimitados', included: true },
      { name: 'SSO / SAML', included: true },
      { name: 'Auditoria em tempo real', included: true },
      { name: 'VPC Dedicada', included: true },
      { name: 'Suporte prioritário 24/7', included: true },
      { name: 'Consultoria especializada', included: true },
    ],
    custom: true,
    priceId: null,
  },
];

export const PricingPage = ({ onBack }: { onBack?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const handleCheckout = async (priceId: string | null) => {
    if (!priceId) {
      window.location.href = '/contact-sales';
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/stripe/create-checkout-session', {
        priceId,
        tenantId: '1', 
        userId: '1',
      });
      
      const { sessionId, url } = response.data;
      
      if (url && url.startsWith('http')) {
        try {
          if (window.self !== window.top) {
            window.open(url, '_blank');
          } else {
            window.location.href = url;
          }
        } catch (e) {
          // Fallback if cross-origin policy blocks window.top access
          window.open(url, '_blank');
        }
      } else {
        const stripe: any = await stripePromise;
        if (stripe && sessionId !== 'mock-session-id') {
          const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
          });
          if (error) throw error;
        } else if (sessionId === 'mock-session-id') {
          alert('Mock checkout session created successfully.');
        }
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Erro ao iniciar o checkout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white py-20 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack || (() => window.location.reload())} className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"><X size={20}/> Voltar</button>
        <h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Preços simples e transparentes
        </h1>
        <p className="text-center text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Escolha o plano ideal para sua empresa. Todos os planos incluem scanner de IaC e integração com GitHub.
        </p>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                billingInterval === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                billingInterval === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual <span className="text-xs text-green-400 ml-1">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = billingInterval === 'yearly' && plan.price ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-2xl p-8 border ${
                  plan.popular ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  {price ? (
                    <span className="text-4xl font-bold">${price}</span>
                  ) : (
                    <span className="text-2xl font-semibold">Sob consulta</span>
                  )}
                  {price && <span className="text-gray-400 text-lg">/mês</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feat.included ? (
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feat.included ? 'text-gray-300' : 'text-gray-500'}>
                        {feat.name}
                        {feat.included && plan.popular && <Sparkles className="inline w-3 h-3 text-yellow-400 ml-1" />}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processando...' : plan.custom ? 'Falar com Vendas' : 'Assinar Agora'}
                </button>
                {plan.id === 'pro' && (
                  <p className="text-center text-xs text-gray-400 mt-3">Teste gratuito de 30 dias</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center text-sm text-gray-400 mt-12">
          <p>Todos os planos incluem suporte via email e atualizações automáticas.</p>
          <p className="mt-2">Cancele a qualquer momento. Sem fidelidade.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
