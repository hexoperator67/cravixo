import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe, isStripeConfigured } from "@/lib/stripe";

const checkoutSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please set up STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: session.user.id },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const sessionUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        ...order.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.menuItem.name,
            },
            unit_amount: item.price,
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Delivery Fee" },
            unit_amount: order.deliveryFee,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Tax" },
            unit_amount: order.tax,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
        userId: session.user.id,
      },
      success_url: `${sessionUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${sessionUrl}/orders/${order.id}?payment=cancelled`,
    });

    const existingPayment = await prisma.payment.findFirst({
      where: { orderId: order.id },
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { stripeSessionId: checkoutSession.id },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          stripeSessionId: checkoutSession.id,
          amount: order.total,
        },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout failed:", err);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}