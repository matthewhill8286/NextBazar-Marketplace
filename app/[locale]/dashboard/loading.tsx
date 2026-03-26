import {
  Bone,
  HeaderSkeleton,
  StatsGridSkeleton,
  TabsSkeleton,
  ListRowSkeleton,
} from "./loading-skeleton";

/** Overview page loading skeleton. */
export default function DashboardLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <div className="mb-4 flex items-center justify-between">
        <Bone className="h-5 w-28" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
      <TabsSkeleton count={4} />
      <ListRowSkeleton count={5} />
    </div>
  );
}
