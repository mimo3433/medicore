import { Stethoscope } from 'lucide-react';

export default function SkeletonLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Stethoscope className="h-10 w-10 text-blue-400 animate-pulse" />
        <div className="absolute inset-0 h-10 w-10 bg-blue-400/20 rounded-full animate-ping" />
      </div>
      <div className="space-y-2 w-48">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto animate-pulse" />
      </div>
    </div>
  );
}
