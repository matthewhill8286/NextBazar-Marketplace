/** Skeleton fallbacks for home page streaming sections. */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#2C2826]">
      <div className="absolute inset-0 bg-[#2C2826]" />
      <div className="relative w-full max-w-7xl mx-auto px-6 py-24">
        <Bone className="h-3 w-40 mb-8 !bg-white/20" />
        <Bone className="h-16 md:h-20 w-3/4 max-w-3xl mb-4 !bg-white/15" />
        <Bone className="h-16 md:h-20 w-1/2 max-w-2xl mb-8 !bg-white/15" />
        <Bone className="h-5 w-full max-w-xl mb-12 !bg-white/10" />
        <div className="flex gap-4">
          <Bone className="h-14 w-44 !bg-white/20" />
          <Bone className="h-14 w-44 !bg-white/10" />
        </div>
      </div>
    </section>
  );
}

export function WhySkeleton() {
  return (
    <section className="relative overflow-hidden bg-[#2C2826] text-white">
      <div className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Bone className="h-3 w-28 mx-auto mb-4 !bg-white/15" />
          <Bone className="h-12 w-72 mx-auto !bg-white/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Bone className="h-3 w-8 mb-6 !bg-white/15" />
              <Bone className="h-7 w-40 mb-4 !bg-white/10" />
              <Bone className="h-4 w-full mb-2 !bg-white/10" />
              <Bone className="h-4 w-3/4 !bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
      <div className="text-center mb-14">
        <Bone className="h-3 w-24 mx-auto mb-4" />
        <Bone className="h-9 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[#e8e6e3] p-6 text-center"
          >
            <Bone className="w-14 h-14 rounded-full mx-auto mb-4" />
            <Bone className="h-4 w-20 mx-auto mb-2" />
            <Bone className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedSkeleton() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <Bone className="h-3 w-28 mb-4" />
            <Bone className="h-9 w-56" />
          </div>
          <Bone className="h-4 w-20 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-[#e8e6e3] bg-white">
              <Bone className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
                <Bone className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecentSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex items-end justify-between mb-12">
        <div>
          <Bone className="h-3 w-24 mb-4" />
          <Bone className="h-9 w-48" />
        </div>
        <Bone className="h-4 w-20 hidden md:block" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-[#e8e6e3] bg-white">
            <Bone className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
              <Bone className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrendingSkeleton() {
  return (
    <section className="py-20">
      <div className="flex items-end justify-between mb-12">
        <div>
          <Bone className="h-3 w-32 mb-4" />
          <Bone className="h-9 w-52" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-[#e8e6e3] bg-white">
            <Bone className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
              <Bone className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
