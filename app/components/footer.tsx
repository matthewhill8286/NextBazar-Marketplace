import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-900/40">
                N
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                Next<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Bazar</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-[200px]">
              Cyprus&rsquo;s smartest marketplace for buying and selling anything.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Marketplace</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link href="/post" className="hover:text-white transition-colors">Post an Ad</Link></li>
              <li><Link href="/search?sort=newest" className="hover:text-white transition-colors">Recently Added</Link></li>
              <li><Link href="/search?promoted=true" className="hover:text-white transition-colors">Featured Listings</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Account</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/dashboard/listings" className="hover:text-white transition-colors">My Listings</Link></li>
              <li><Link href="/messages" className="hover:text-white transition-colors">Messages</Link></li>
              <li><Link href="/saved" className="hover:text-white transition-colors">Saved Items</Link></li>
              <li><Link href="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Safety Tips</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">For Dealers</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 NextBazar. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
