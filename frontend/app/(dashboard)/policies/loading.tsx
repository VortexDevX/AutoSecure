import { SkeletonTable } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PoliciesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={32} />
        <Skeleton width={140} height={40} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={40} />
          ))}
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
