function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

/* ── Shop card skeleton (matches ShopCard layout) ──────────────────────── */
function ShopCardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e6e3] overflow-hidden">
      <div className="relative">
        <Bone className="h-36 w-full" />
        <div className="absolute top-3 right-3">
          <Bone className="h-5 w-14 rounded-sm" />
        </div>
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 border-[3px] border-white shadow-md overflow-hidden">
            <Bone className="w-full h-full" />
          </div>
        </div>
      </div>
      <div className="pt-12 pb-5 px-5">
        <Bone className="h-5 w-2/3 mb-3" />
        <Bone className="h-3.5 w-full mb-1.5" />
        <Bone className="h-3.5 w-4/5 mb-5" />
        <div className="flex items-center justify-between">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e6e3] overflow-hidden">
      <Bone className="h-44 w-full" />
      <div className="p-3 space-y-2.5">
        <Bone className="h-4 w-5/6" />
        <Bone className="h-3.5 w-1/2" />
        <Bone className="h-3 w-2/3" />
        <div className="pt-1 flex justify-between">
          <Bone className="h-5 w-1/3" />
          <Bone className="h-5 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function VehiclesLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Hero skeleton ─────────────────────────────────────────── */}
      <div className="relative bg-[#2C2826] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Bone className="h-3 w-28 mb-4 bg-white/10" />
            <Bone className="h-10 w-96 mb-4 bg-white/10" />
            <Bone className="h-5 w-80 mb-10 bg-white/10" />
            <Bone className="h-11 w-40 bg-white/10" />
          </div>
        </div>
      </div>

      {/* ── Stats bar skeleton ────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8">
            <Bone className="h-4 w-32" />
            <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
            <Bone className="h-4 w-28" />
            <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
            <Bone className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ── Tab navigation skeleton ──────────────────────────────── */}
        <div className="flex gap-2 mb-8">
          {[96, 128, 128, 112, 160].map((w, i) => (
            <Bone
              key={i}
              className="h-11"
            />
          ))}
        </div>

        {/* ── Tab description skeleton ─────────────────────────────── */}
        <div className="mb-6">
          <Bone className="h-4 w-96" />
        </div>

        {/* ── Filter bar skeleton ──────────────────────────────────── */}
        <div className="mb-8 p-4 bg-white border border-[#e8e6e3]">
          <div className="flex flex-wrap gap-3">
            <Bone className="h-10 w-36" />
            <Bone className="h-10 w-32" />
            <Bone className="h-10 w-36" />
            <Bone className="h-10 w-32" />
            <Bone className="h-10 w-28" />
          </div>
        </div>

        {/* ── Trusted dealerships strip skeleton ───────────────────── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Bone className="w-8 h-8" />
              <div>
                <Bone className="h-5 w-40 mb-1" />
                <Bone className="h-3 w-52" />
              </div>
            </div>
            <Bone className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white border border-[#e8e6e3]"
              >
                <Bone className="shrink-0 w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <Bone className="h-4 w-3/4 mb-1.5" />
                  <Bone className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured listings skeleton ───────────────────────────── */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Bone className="h-6 w-48 mb-1.5" />
              <Bone className="h-3.5 w-64" />
            </div>
            <Bone className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* ── Location section skeleton ────────────────────────────── */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Bone className="w-8 h-8" />
                <div>
                  <Bone className="h-5 w-24 mb-1" />
                  <Bone className="h-3 w-16" />
                </div>
              </div>
              <Bone className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, j) => (
                <ListingCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Exported skeletons for Suspense boundaries ────────────────────────── */

export function ShopsLoadingSkeleton() {
  return (
    <>
      <div className="mb-10 p-6 md:p-8 bg-gradient-to-br from-[#faf9f7] to-[#f5f0eb] border border-[#e8e6e3]">
        <div className="flex items-center gap-2 mb-5">
          <Bone className="w-4 h-4" />
          <Bone className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Bone className="shrink-0 w-8 h-8" />
              <div className="flex-1">
                <Bone className="h-4 w-28 mb-1.5" />
                <Bone className="h-3 w-full mb-1" />
                <Bone className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <Bone className="w-8 h-8" />
          <div>
            <Bone className="h-5 w-44 mb-1" />
            <Bone className="h-3 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <Bone className="w-8 h-8" />
          <div>
            <Bone className="h-5 w-36 mb-1" />
            <Bone className="h-3 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

export { ShopCardSkeleton };
