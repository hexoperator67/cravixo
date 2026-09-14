import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { emitNewOrder, emitOrderStatusUpdate } from "@/lib/socket-events";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const paymentIntentId = session.payment_intent as string | undefined;

      if (!orderId) {
        return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { payment: true },
        });
        if (!order) throw new Error("Order not found");

        const paymentData = {
          stripePaymentIntentId: paymentIntentId,
          status: "succeeded",
        };

        if (order.payment) {
          await tx.payment.update({
            where: { orderId: orderId },
            data: paymentData,
          });
        } else {
          await tx.payment.create({
            data: {
              orderId,
              stripePaymentIntentId: paymentIntentId,
              status: "succeeded",
              amount: order.total,
            },
          });
        }

        if (order.status === "pending") {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "confirmed" },
          });
          emitOrderStatusUpdate(orderId, "confirmed");
          emitNewOrder(order.restaurantId, orderId);
        }
      });

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.payment.updateMany({
          where: { orderId },
          data: { status: "expired" },
        });
      }
      break;
    }

    default:
      // Ignore other event types
      break;
  }

  return NextResponse.json({ received: true });
}