function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] py-8">
      <div className="px-6 max-w-6xl mx-auto">
        {/* Profile header */}
        <div className="bg-white border border-[#e8e6e3] p-6 mb-8 flex gap-6 items-center">
          {/* Avatar */}
          <Bone className="h-24 w-24 flex-shrink-0" />
          {/* Profile info */}
          <div className="flex-1 space-y-2">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-64" />
            <div className="flex gap-4 pt-2">
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Listings section */}
        <div>
          <Bone className="h-6 w-32 mb-4" />
          {/* Listings grid */}
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#e8e6e3] overflow-hidden space-y-3 p-3"
              >
                <Bone className="h-32 w-full" />
                <Bone className="h-4 w-3/4" />
                <Bone className="h-4 w-1/2" />
                <Bone className="h-5 w-2/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
