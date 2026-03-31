function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero skeleton */}
      <Bone className="w-full h-24" />

      <div className="flex gap-6 p-6">
        {/* Sidebar filters */}
        <div className="w-64 space-y-4">
          <Bone className="h-10 w-full" />
          <Bone className="h-6 w-3/4" />
          <Bone className="h-6 w-full" />
          <Bone className="h-6 w-5/6" />
          <div className="pt-4 border-t border-[#e8e6e3]">
            <Bone className="h-6 w-1/2 mb-3" />
            <Bone className="h-6 w-full mb-2" />
            <Bone className="h-6 w-full mb-2" />
            <Bone className="h-6 w-5/6" />
          </div>
        </div>

        {/* Listings grid */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e6e3] overflow-hidden space-y-3 p-3"
            >
              <Bone className="h-48 w-full" />
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-1/2" />
              <Bone className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
