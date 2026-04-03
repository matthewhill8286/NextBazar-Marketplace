import { Bone, HeaderSkeleton, ListRowSkeleton } from "../loading-skeleton";

export default function NotificationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <HeaderSkeleton subtitle={false} />
        <Bone className="h-8 w-24 " />
      </div>
      <ListRowSkeleton count={6} />
    </div>
  );
}
