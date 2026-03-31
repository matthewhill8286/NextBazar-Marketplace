function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function ShopsLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] py-8">
      <div className="px-6 max-w-7xl mx-auto">
        {/* Heading */}
        <Bone className="h-8 w-48 mb-8" />

        {/* Shop cards grid - 3 columns */}
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e6e3] overflow-hidden space-y-3 p-4"
            >
              {/* Shop avatar */}
              <Bone className="h-24 w-24 mx-auto" />
              {/* Shop name */}
              <Bone className="h-5 w-3/4 mx-auto" />
              {/* Description */}
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              {/* Rating/stats */}
              <div className="pt-2 flex gap-2">
                <Bone className="h-4 flex-1" />
                <Bone className="h-4 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
