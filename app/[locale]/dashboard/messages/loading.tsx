import { Bone } from "../loading-skeleton";

export default function MessagesLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Bone className="h-7 w-32 mb-6" />
      <Bone className="h-10 w-full rounded-xl mb-4" />
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4">
            <Bone className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-10" />
              </div>
              <Bone className="h-3 w-48" />
              <Bone className="h-3 w-36" />
            </div>
            <Bone className="w-10 h-10 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
