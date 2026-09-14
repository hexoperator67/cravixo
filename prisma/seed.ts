import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.restaurant.count()) > 0) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  console.log("Seeding database...");

  // Clean up existing data (in dependency order)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const customerPassword = await bcrypt.hash("password123", 10);

  const customer = await prisma.user.create({
    data: {
      email: "customer@cravixo.com",
      name: "Test Customer",
      passwordHash: customerPassword,
      role: "customer",
      phone: "+1 (555) 010-1000",
      addresses: {
        create: {
          label: "Home",
          street: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
        },
      },
    },
  });

  const ownerPassword = await bcrypt.hash("restaurant123", 10);

  const owner1 = await prisma.user.create({
    data: {
      email: "owner@curryhouse.com",
      name: "Raj Sharma",
      passwordHash: ownerPassword,
      role: "restaurant_owner",
      phone: "+1 (555) 200-1001",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: "owner@pizzeria.com",
      name: "Maria Rossi",
      passwordHash: ownerPassword,
      role: "restaurant_owner",
      phone: "+1 (555) 200-1002",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@cravixo.com",
      name: "CRAVIXO Admin",
      passwordHash: ownerPassword,
      role: "admin",
    },
  });

  const rider = await prisma.user.create({
    data: {
      email: "rider@cravixo.com",
      name: "Alex Rider",
      passwordHash: ownerPassword,
      role: "delivery_rider",
      phone: "+1 (555) 010-2000",
    },
  });

  console.log("Created users:", customer.email, owner1.email, owner2.email, admin.email, rider.email);

  // Restaurant 1: Curry House
  const curryHouse = await prisma.restaurant.create({
    data: {
      name: "Curry House",
      slug: "curry-house",
      description: "Authentic Indian curries, tandoori dishes and flavorful biryanis.",
      address: "456 Market Street, San Francisco, CA 94103",
      phone: "+1 (555) 200-1001",
      email: "order@curryhouse.com",
      image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
      coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600",
      rating: 4.5,
      totalRatings: 320,
      estimatedDeliveryTime: 35,
      minimumOrder: 1500,
      openingTime: "10:00",
      closingTime: "23:00",
      ownerId: owner1.id,
    },
  });

  const starters = await prisma.menuCategory.create({
    data: {
      name: "Starters",
      description: "Perfect way to begin your meal",
      sortOrder: 1,
      restaurantId: curryHouse.id,
    },
  });

  const mains = await prisma.menuCategory.create({
    data: {
      name: "Main Course",
      sortOrder: 2,
      restaurantId: curryHouse.id,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: "Desserts",
      sortOrder: 3,
      restaurantId: curryHouse.id,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        name: "Paneer Tikka",
        description: "Cottage cheese marinated in spices, grilled in tandoor",
        price: 899,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500",
        categoryId: starters.id,
        restaurantId: curryHouse.id,
        isVegetarian: true,
        spiceLevel: 2,
        preparationTime: 15,
      },
      {
        name: "Chicken Tandoori",
        description: "Char-grilled chicken marinated with yogurt and spices",
        price: 1299,
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500",
        categoryId: starters.id,
        restaurantId: curryHouse.id,
        spiceLevel: 2,
        preparationTime: 22,
      },
      {
        name: "Butter Chicken",
        description: "Creamy tomato-curry sauce with tender chicken",
        price: 1499,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500",
        categoryId: mains.id,
        restaurantId: curryHouse.id,
        spiceLevel: 1,
        preparationTime: 20,
      },
      {
        name: "Paneer Butter Masala",
        description: "Paneer in rich, creamy buttery gravy",
        price: 1399,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
        categoryId: mains.id,
        restaurantId: curryHouse.id,
        isVegetarian: true,
        spiceLevel: 1,
        preparationTime: 20,
      },
      {
        name: "Chicken Biryani",
        description: "Fragrant basmati rice layered with spiced chicken",
        price: 1599,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        categoryId: mains.id,
        restaurantId: curryHouse.id,
        spiceLevel: 3,
        preparationTime: 25,
      },
      {
        name: "Garlic Naan",
        description: "Soft flatbread topped with garlic and butter",
        price: 299,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500",
        categoryId: mains.id,
        restaurantId: curryHouse.id,
        isVegetarian: true,
        preparationTime: 10,
      },
      {
        name: "Gulab Jamun (2 pcs)",
        description: "Soft dumplings soaked in rose-petal syrup",
        price: 349,
        image: "https://images.unsplash.com/photo-1601303516541-1322c64eeb68?w=500",
        categoryId: desserts.id,
        restaurantId: curryHouse.id,
        isVegetarian: true,
        isGlutenFree: true,
        preparationTime: 5,
      },
    ],
  });

  // Restaurant 2: Rossi's Pizzeria
  const pizzeria = await prisma.restaurant.create({
    data: {
      name: "Rossi's Pizzeria",
      slug: "rossis-pizzeria",
      description: "Wood-fired Neapolitan pizzas, fresh pastas and Italian classics.",
      address: "789 Valencia Street, San Francisco, CA 94110",
      phone: "+1 (555) 200-1002",
      email: "order@rossis.com",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
      coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600",
      rating: 4.7,
      totalRatings: 510,
      estimatedDeliveryTime: 30,
      minimumOrder: 1200,
      openingTime: "11:00",
      closingTime: "22:30",
      ownerId: owner2.id,
    },
  });

  const pizzas = await prisma.menuCategory.create({
    data: {
      name: "Pizzas",
      description: "Baked fresh in our wood-fired oven",
      sortOrder: 1,
      restaurantId: pizzeria.id,
    },
  });

  const pastas = await prisma.menuCategory.create({
    data: {
      name: "Pastas",
      sortOrder: 2,
      restaurantId: pizzeria.id,
    },
  });

  const drinks = await prisma.menuCategory.create({
    data: {
      name: "Drinks & Desserts",
      sortOrder: 3,
      restaurantId: pizzeria.id,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        name: "Margherita Pizza",
        description: "San Marzano tomato, fresh mozzarella, basil",
        price: 1199,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        categoryId: pizzas.id,
        restaurantId: pizzeria.id,
        isVegetarian: true,
        preparationTime: 20,
      },
      {
        name: "Pepperoni Pizza",
        description: "Classic pepperoni, mozzarella, tomato sauce",
        price: 1499,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
        categoryId: pizzas.id,
        restaurantId: pizzeria.id,
        spiceLevel: 1,
        preparationTime: 22,
      },
      {
        name: "Quattro Formaggi",
        description: "Four-cheese delight with mozzarella, gorgonzola, parmesan, ricotta",
        price: 1699,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
        categoryId: pizzas.id,
        restaurantId: pizzeria.id,
        isVegetarian: true,
        preparationTime: 22,
      },
      {
        name: "Spaghetti Carbonara",
        description: "Creamy egg sauce, pancetta, pecorino romano",
        price: 1399,
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500",
        categoryId: pastas.id,
        restaurantId: pizzeria.id,
        preparationTime: 18,
      },
      {
        name: "Penne Arrabbiata",
        description: "Spicy tomato sauce, garlic, chili flakes",
        price: 1299,
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc129d5b9?w=500",
        categoryId: pastas.id,
        restaurantId: pizzeria.id,
        isVegetarian: true,
        isVegan: true,
        spiceLevel: 2,
        preparationTime: 18,
      },
      {
        name: "Tiramisu",
        description: "Espresso-soaked ladyfingers with mascarpone",
        price: 799,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
        categoryId: drinks.id,
        restaurantId: pizzeria.id,
        isVegetarian: true,
        preparationTime: 5,
      },
      {
        name: "Sparkling Water (750ml)",
        description: "Chilled Italian sparkling mineral water",
        price: 399,
        categoryId: drinks.id,
        restaurantId: pizzeria.id,
        isVegan: true,
        isGlutenFree: true,
        preparationTime: 2,
      },
    ],
  });

  // Restaurant 3: Green Bowl (healthy)
  const greenBowl = await prisma.restaurant.create({
    data: {
      name: "Green Bowl",
      slug: "green-bowl",
      description: "Fresh salads, grain bowls and smoothies for a healthy day.",
      address: "1001 Market Street, San Francisco, CA 94103",
      phone: "+1 (555) 200-1003",
      email: "hello@greenbowl.com",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600",
      rating: 4.3,
      totalRatings: 180,
      estimatedDeliveryTime: 25,
      minimumOrder: 1000,
      openingTime: "08:00",
      closingTime: "21:00",
      ownerId: admin.id,
    },
  });

  const bowls = await prisma.menuCategory.create({
    data: {
      name: "Signature Bowls",
      sortOrder: 1,
      restaurantId: greenBowl.id,
    },
  });

  const salads = await prisma.menuCategory.create({
    data: {
      name: "Salads",
      sortOrder: 2,
      restaurantId: greenBowl.id,
    },
  });

  const smoothies = await prisma.menuCategory.create({
    data: {
      name: "Smoothies",
      sortOrder: 3,
      restaurantId: greenBowl.id,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        name: "Greek Buddha Bowl",
        description: "Quinoa, roasted chickpeas, cucumber, tzatziki, feta",
        price: 1299,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        categoryId: bowls.id,
        restaurantId: greenBowl.id,
        isVegetarian: true,
        isGlutenFree: true,
        preparationTime: 15,
      },
      {
        name: "Teriyaki Tofu Bowl",
        description: "Crispy tofu, brown rice, broccoli, teriyaki glaze",
        price: 1399,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
        categoryId: bowls.id,
        restaurantId: greenBowl.id,
        isVegan: true,
        preparationTime: 15,
      },
      {
        name: "Caesar Salad",
        description: "Romaine, parmesan, garlic croutons, caesar dressing",
        price: 1099,
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500",
        categoryId: salads.id,
        restaurantId: greenBowl.id,
        isVegetarian: true,
        preparationTime: 10,
      },
      {
        name: "Mango Tango Smoothie",
        description: "Mango, banana, coconut milk, chia seeds",
        price: 699,
        image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500",
        categoryId: smoothies.id,
        restaurantId: greenBowl.id,
        isVegan: true,
        isGlutenFree: true,
        preparationTime: 5,
      },
      {
        name: "Berry Blast Smoothie",
        description: "Mixed berries, Greek yogurt, honey, oats",
        price: 749,
        categoryId: smoothies.id,
        restaurantId: greenBowl.id,
        isVegetarian: true,
        preparationTime: 5,
      },
    ],
  });

  // Address for green bowl owner handled above (admin has no restaurant relation conflict,
  // we gave greenBowl ownerId = admin.id)

  // Sample historical orders for the dashboards
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-00001",
      status: "delivered",
      subtotal: 2898,
      deliveryFee: 299,
      tax: 232,
      total: 3429,
      deliveryAddress: "123 Main Street, San Francisco, CA 94105",
      userId: customer.id,
      restaurantId: curryHouse.id,
      estimatedDeliveryTime: new Date(Date.now() - 3600000),
      actualDeliveryTime: new Date(Date.now() - 1800000),
      items: {
        create: [
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Butter Chicken", restaurantId: curryHouse.id },
              })
            ).id,
            quantity: 1,
            price: 1499,
            subtotal: 1499,
          },
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Garlic Naan", restaurantId: curryHouse.id },
              })
            ).id,
            quantity: 2,
            price: 299,
            subtotal: 598,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      status: "succeeded",
      amount: order1.total,
      currency: "usd",
      orderId: order1.id,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-00002",
      status: "delivered",
      subtotal: 2698,
      deliveryFee: 299,
      tax: 216,
      total: 3213,
      deliveryAddress: "123 Main Street, San Francisco, CA 94105",
      userId: customer.id,
      restaurantId: pizzeria.id,
      estimatedDeliveryTime: new Date(Date.now() - 7200000),
      actualDeliveryTime: new Date(Date.now() - 5400000),
      items: {
        create: [
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Margherita Pizza", restaurantId: pizzeria.id },
              })
            ).id,
            quantity: 1,
            price: 1199,
            subtotal: 1199,
          },
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Tiramisu", restaurantId: pizzeria.id },
              })
            ).id,
            quantity: 1,
            price: 799,
            subtotal: 799,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      status: "succeeded",
      amount: order2.total,
      currency: "usd",
      orderId: order2.id,
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: "ORD-00003",
      status: "ready",
      subtotal: 2698,
      deliveryFee: 299,
      tax: 216,
      total: 3213,
      deliveryAddress: "234 Oak Avenue, San Francisco, CA 94112",
      specialInstructions: "Please call on arrival.",
      userId: customer.id,
      restaurantId: curryHouse.id,
      riderId: rider.id,
      estimatedDeliveryTime: new Date(Date.now() + 1200000),
      items: {
        create: [
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Chicken Biryani", restaurantId: curryHouse.id },
              })
            ).id,
            quantity: 1,
            price: 1599,
            subtotal: 1599,
          },
          {
            menuItemId: (
              await prisma.menuItem.findFirstOrThrow({
                where: { name: "Gulab Jamun (2 pcs)", restaurantId: curryHouse.id },
              })
            ).id,
            quantity: 1,
            price: 349,
            subtotal: 349,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      status: "succeeded",
      amount: order3.total,
      currency: "usd",
      orderId: order3.id,
    },
  });

  console.log("Seeded 3 restaurants with menus, 3 orders and a delivery rider!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });