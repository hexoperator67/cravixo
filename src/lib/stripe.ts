import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return (
    key.startsWith("sk_") &&
    !key.includes("placeholder")
  );
}

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cachedStripe) {
    const key = process.env.STRIPE_SECRET_KEY ?? "";
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured");
    }
    cachedStripe = new Stripe(key);
  }
  return cachedStripe;
}