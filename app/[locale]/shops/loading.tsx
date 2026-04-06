function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

function ShopCardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e6e3] overflow-hidden">
      {/* Banner */}
      <div className="relative">
        <Bone className="h-36 w-full" />
        {/* Badge placeholder */}
        <div className="absolute top-3 right-3">
          <Bone className="h-6 w-20 rounded-sm" />
        </div>
        {/* Logo overlay */}
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 border-[3px] border-white shadow-md bg-white">
            <Bone className="w-full h-full" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="pt-12 pb-5 px-5">
        <Bone className="h-5 w-40 mb-3" />
        <Bone className="h-4 w-full mb-1.5" />
        <Bone className="h-4 w-3/4 mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bone className="h-3.5 w-20" />
          </div>
          <Bone className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function ShopsLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Hero Skeleton ──────────────────────────────────────────────── */}
      <div className="bg-[#faf9f7] border-b border-[#e8e6e3]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="flex items-center justify-center mb-4">
              <Bone className="h-3 w-32" />
            </div>
            {/* Title */}
            <div className="flex justify-center mb-4">
              <Bone className="h-10 md:h-14 w-72 md:w-96" />
            </div>
            {/* Subtitle */}
            <div className="flex justify-center mb-10">
              <Bone className="h-5 w-80 max-w-full" />
            </div>
            {/* Search bar */}
            <div className="max-w-lg mx-auto">
              <Bone className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Skeleton ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <Bone className="h-4 w-28" />
          <Bone className="h-9 w-36" />
        </div>

        {/* Shop cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
