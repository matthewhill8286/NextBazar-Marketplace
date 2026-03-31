/** Shop page skeleton — shown instantly while the server component fetches data. */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero Banner */}
      <div className="relative">
        <Bone className="h-56 sm:h-64 md:h-72 lg:h-80 w-full" />
      </div>

      {/* Shop Info Card */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white border border-[#e8e6e3] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Logo */}
              <Bone className="w-20 h-20 md:w-24 md:h-24 shrink-0 -mt-14 md:-mt-16 border-4 border-white shadow-md" />

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                  <Bone className="h-8 w-48" />
                  <Bone className="h-6 w-32" />
                </div>
                <Bone className="h-4 w-full max-w-lg" />
                <Bone className="h-4 w-3/4 max-w-md" />
                {/* Meta chips */}
                <div className="flex items-center gap-2 pt-1">
                  <Bone className="h-7 w-32" />
                  <Bone className="h-7 w-24" />
                </div>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-2 shrink-0">
                <Bone className="w-10 h-10" />
                <Bone className="w-10 h-10" />
                <Bone className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-6 border-b border-[#e8e6e3] pb-3 mb-8">
          <Bone className="h-5 w-20" />
          <Bone className="h-5 w-16" />
          <Bone className="h-5 w-24" />
        </div>

        {/* Listing Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#e8e6e3]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white">
              <Bone className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
                <Bone className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
