function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero banner skeleton */}
      <Bone className="w-full h-32" />

      {/* Filter bar */}
      <div className="bg-white border-b border-[#e8e6e3] px-6 py-4">
        <div className="max-w-7xl mx-auto flex gap-4">
          <Bone className="h-10 w-40" />
          <Bone className="h-10 w-40" />
          <Bone className="h-10 w-40" />
        </div>
      </div>

      {/* Listings grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <Bone className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e6e3] overflow-hidden space-y-3 p-3"
            >
              <Bone className="h-40 w-full" />
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-1/2" />
              <Bone className="h-4 w-2/3" />
              <div className="pt-1 flex justify-between">
                <Bone className="h-5 w-1/3" />
                <Bone className="h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
