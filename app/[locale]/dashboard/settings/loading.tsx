import { Bone, CardSkeleton } from "../loading-skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <Bone className="h-7 w-28 mb-6" />
      <div className="space-y-6">
        {/* Profile section */}
        <CardSkeleton>
          <div className="flex items-center gap-4 mb-6">
            <Bone className="w-20 h-20 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Bone className="h-5 w-40" />
              <Bone className="h-4 w-56" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </CardSkeleton>

        {/* Social links section */}
        <CardSkeleton>
          <Bone className="h-5 w-28 mb-4" />
          <div className="space-y-4">
            <Bone className="h-10 w-full rounded-xl" />
            <Bone className="h-10 w-full rounded-xl" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
        </CardSkeleton>

        {/* Save button */}
        <Bone className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
