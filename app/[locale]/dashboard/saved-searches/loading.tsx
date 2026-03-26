import { Bone } from "../loading-skeleton";

export default function SavedSearchesLoading() {
  return (
    <div>
      <Bone className="h-7 w-40 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
          >
            <Bone className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-32" />
            </div>
            <Bone className="w-8 h-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
