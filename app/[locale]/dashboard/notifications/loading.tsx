import { Bone } from "../loading-skeleton";

export default function NotificationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Bone className="h-7 w-36" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Bone className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/3" />
            </div>
            <Bone className="w-12 h-3 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
