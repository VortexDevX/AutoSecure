import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPageLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={32} />
        <Skeleton width={120} height={40} />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width={80} height={32} className="mb-2" />
            <Skeleton width={60} height={14} />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton height={200} />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton height={200} />
        </div>
      </div>
    </div>
  );
}
