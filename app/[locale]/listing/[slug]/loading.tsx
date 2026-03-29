/** Listing detail skeleton — shown instantly while the server component fetches data. */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2">
          <Bone className="h-4 w-12" />
          <Bone className="h-3 w-3" />
          <Bone className="h-4 w-20" />
          <Bone className="h-3 w-3" />
          <Bone className="h-4 w-32" />
        </div>
      </div>

      {/* Image gallery skeleton */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-1">
          {/* Main image */}
          <Bone className="aspect-[4/3] w-full" />
          {/* Thumbnail strip */}
          <div className="hidden md:grid grid-rows-4 gap-1">
            <Bone className="w-full h-full" />
            <Bone className="w-full h-full" />
            <Bone className="w-full h-full" />
            <Bone className="w-full h-full" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Bone className="h-7 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Bone className="h-4 w-24" />
                    <Bone className="h-4 w-20" />
                  </div>
                </div>
                <Bone className="h-9 w-9 shrink-0" />
              </div>
              <div className="border-t border-[#f0eeeb] pt-4 flex items-center gap-4">
                <Bone className="h-3 w-16" />
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-16" />
              </div>
            </div>

            {/* Price card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-3">
              <Bone className="h-4 w-12" />
              <Bone className="h-10 w-36" />
              <Bone className="h-3 w-24" />
            </div>

            {/* Description card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-3">
              <Bone className="h-5 w-28" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-4 w-2/3" />
            </div>

            {/* Details grid */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-4">
              <Bone className="h-5 w-20" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Bone className="h-3 w-16" />
                    <Bone className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — seller sidebar */}
          <div className="space-y-6">
            {/* Seller card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Bone className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <Bone className="h-11 w-full" />
              <Bone className="h-11 w-full" />
            </div>

            {/* Location card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-3">
              <Bone className="h-5 w-20" />
              <Bone className="h-4 w-36" />
              <Bone className="h-32 w-full" />
            </div>

            {/* Safety card */}
            <div className="bg-white border border-[#e8e6e3] p-6 space-y-3">
              <Bone className="h-5 w-24" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
