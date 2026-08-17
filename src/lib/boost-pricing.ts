// مصفوفة الأسعار والعملات لترقية الإعلانات الفردية (Boost Plans)
export interface BoostPricingItem {
  amountCents: number;
  displayPrice: string;
  currency: string;
  durationDays: number;
}

export const PLAN_PRICES: Record<'silver' | 'gold', Record<string, BoostPricingItem>> = {
  silver: {
    sa: { amountCents: 2000, displayPrice: '20', currency: 'SAR', durationDays: 30 },
    eg: { amountCents: 25000, displayPrice: '250', currency: 'EGP', durationDays: 30 },
    ae: { amountCents: 2000, displayPrice: '20', currency: 'AED', durationDays: 30 },
    kw: { amountCents: 200, displayPrice: '2', currency: 'KWD', durationDays: 30 },
    qa: { amountCents: 2000, displayPrice: '20', currency: 'QAR', durationDays: 30 },
    bh: { amountCents: 200, displayPrice: '2', currency: 'BHD', durationDays: 30 },
    om: { amountCents: 200, displayPrice: '2', currency: 'OMR', durationDays: 30 },
    jo: { amountCents: 400, displayPrice: '4', currency: 'JOD', durationDays: 30 },
    iq: { amountCents: 700000, displayPrice: '7,000', currency: 'IQD', durationDays: 30 },
    ma: { amountCents: 5000, displayPrice: '50', currency: 'MAD', durationDays: 30 },
    dz: { amountCents: 70000, displayPrice: '700', currency: 'DZD', durationDays: 30 },
    default: { amountCents: 500, displayPrice: '5', currency: 'USD', durationDays: 30 },
  },
  gold: {
    sa: { amountCents: 6000, displayPrice: '60', currency: 'SAR', durationDays: 60 },
    eg: { amountCents: 75000, displayPrice: '750', currency: 'EGP', durationDays: 60 },
    ae: { amountCents: 6000, displayPrice: '60', currency: 'AED', durationDays: 60 },
    kw: { amountCents: 500, displayPrice: '5', currency: 'KWD', durationDays: 60 },
    qa: { amountCents: 6000, displayPrice: '60', currency: 'QAR', durationDays: 60 },
    bh: { amountCents: 600, displayPrice: '6', currency: 'BHD', durationDays: 60 },
    om: { amountCents: 600, displayPrice: '6', currency: 'OMR', durationDays: 60 },
    jo: { amountCents: 1200, displayPrice: '12', currency: 'JOD', durationDays: 60 },
    iq: { amountCents: 2000000, displayPrice: '20,000', currency: 'IQD', durationDays: 60 },
    ma: { amountCents: 15000, displayPrice: '150', currency: 'MAD', durationDays: 60 },
    dz: { amountCents: 200000, displayPrice: '2,000', currency: 'DZD', durationDays: 60 },
    default: { amountCents: 1500, displayPrice: '15', currency: 'USD', durationDays: 60 },
  },
};
