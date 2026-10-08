import type { Brief } from './types';

// Fictional starting points for trying the studio. No real companies or results.
export const SAMPLE_BRIEFS: { title: string; brief: Omit<Brief, 'platforms'> }[] = [
  {
    title: 'Product update',
    brief: {
      idea: 'We rebuilt our onboarding flow. New users now see a three-step checklist instead of a blank dashboard. The checklist adapts to the plan you picked. You can skip any step and come back to it later.',
      goal: 'announce', tone: 'friendly', audience: 'SaaS founders', emoji: true, hashtags: true,
    },
  },
  {
    title: 'Lesson learned',
    brief: {
      idea: 'Shipping small changes every day beats one big release a month. Small changes are easier to review. Bugs are easier to trace back. Customers see progress and tell you sooner when something is off.',
      goal: 'teach', tone: 'professional', audience: 'engineering leads', emoji: false, hashtags: true,
    },
  },
  {
    title: 'Blog promotion',
    brief: {
      idea: 'Our new guide explains how to write a pricing page that answers questions before people ask them. It covers plan names, what to put above the fold, and how to handle FAQs.',
      goal: 'traffic', tone: 'bold', audience: 'founders', link: 'https://example.com/pricing-guide', emoji: true, hashtags: true,
    },
  },
];
