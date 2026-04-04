import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-[#8E7A6B] mb-4">404</p>
          <h1 className="font-['Playfair_Display',serif] text-2xl text-[#1a1a1a] mb-4">
            Page not found
          </h1>
          <p className="text-[#6b6560] mb-8 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Try
            searching for what you need or head back to the homepage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/en"
              className="px-6 py-2.5 bg-[#8E7A6B] text-white text-xs uppercase tracking-[0.15em] hover:bg-[#7A6657] transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/en/search"
              className="px-6 py-2.5 border border-[#e8e6e3] text-[#1a1a1a] text-xs uppercase tracking-[0.15em] hover:bg-[#f0eeeb] transition-colors"
            >
              Search Listings
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
