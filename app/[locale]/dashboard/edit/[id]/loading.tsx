import { Bone, CardSkeleton } from "../../loading-skeleton";

export default function EditListingLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bone className="w-8 h-8 " />
        <Bone className="h-7 w-36" />
      </div>
      <div className="space-y-6">
        {/* Image upload area */}
        <CardSkeleton>
          <Bone className="h-5 w-20 mb-3" />
          <Bone className="h-40 w-full " />
        </CardSkeleton>

        {/* Form fields */}
        <CardSkeleton>
          <div className="space-y-4">
            <div className="space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-10 w-full " />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-24 w-full " />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Bone className="h-3 w-12" />
                <Bone className="h-10 w-full " />
              </div>
              <div className="space-y-2">
                <Bone className="h-3 w-20" />
                <Bone className="h-10 w-full " />
              </div>
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-10 w-full " />
            </div>
          </div>
        </CardSkeleton>

        <Bone className="h-11 w-full " />
      </div>
    </div>
  );
}
