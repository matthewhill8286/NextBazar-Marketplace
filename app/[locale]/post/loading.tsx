function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

export default function PostLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Heading */}
        <Bone className="h-8 w-48 mb-8" />

        {/* Image upload area */}
        <div className="bg-white border border-[#e8e6e3] p-8 mb-6 text-center">
          <Bone className="h-32 w-32 mx-auto mb-4 rounded-sm" />
          <Bone className="h-4 w-48 mx-auto" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e8e6e3] p-4">
            <Bone className="h-5 w-32 mb-2" />
            <Bone className="h-10 w-full" />
          </div>

          <div className="bg-white border border-[#e8e6e3] p-4">
            <Bone className="h-5 w-32 mb-2" />
            <Bone className="h-24 w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e8e6e3] p-4">
              <Bone className="h-5 w-24 mb-2" />
              <Bone className="h-10 w-full" />
            </div>
            <div className="bg-white border border-[#e8e6e3] p-4">
              <Bone className="h-5 w-24 mb-2" />
              <Bone className="h-10 w-full" />
            </div>
          </div>

          {/* Submit button */}
          <Bone className="h-12 w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
