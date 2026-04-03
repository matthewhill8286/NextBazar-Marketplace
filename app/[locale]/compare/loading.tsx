function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function CompareLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] py-8">
      <div className="px-6 max-w-7xl mx-auto">
        {/* Heading */}
        <Bone className="h-8 w-48 mb-8" />

        {/* Comparison cards - 3 columns */}
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e6e3] overflow-hidden"
            >
              {/* Product image */}
              <Bone className="h-48 w-full" />

              {/* Card content */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <Bone className="h-5 w-full" />
                {/* Price */}
                <Bone className="h-6 w-1/2" />
                {/* Specs section */}
                <div className="pt-2 border-t border-[#e8e6e3] space-y-2">
                  <Bone className="h-4 w-full" />
                  <Bone className="h-4 w-5/6" />
                  <Bone className="h-4 w-4/5" />
                </div>
                {/* Button */}
                <Bone className="h-10 w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
