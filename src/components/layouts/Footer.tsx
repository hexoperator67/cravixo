import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary text-white text-lg font-bold px-2 py-0.5 rounded-lg">
                CX
              </span>
              <span className="font-bold text-primary">CRAVIXO</span>
            </div>
            <p className="text-sm text-zinc-500">
              Order food online from the best local restaurants. Find your next craving.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">For Customers</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/" className="hover:text-primary">
                  Search Restaurants
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">For Restaurants</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Restaurant Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/menu" className="hover:text-primary">
                  Manage Menu
                </Link>
              </li>
              <li>
                <Link href="/admin/orders" className="hover:text-primary">
                  Receive Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">For Riders</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/rider" className="hover:text-primary">
                  Delivery Dashboard
                </Link>
              </li>
              <li>
                <Link href="/register?role=delivery_rider" className="hover:text-primary">
                  Become a Rider
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <a href="#" className="hover:text-primary">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-200 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} CRAVIXO. All rights reserved.
        </div>
      </div>
    </footer>
  );
}