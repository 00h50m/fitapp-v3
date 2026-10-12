import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Skeletons com a silhueta real de cada tela — carregando, o aluno já vê
// onde cada bloco vai aparecer, em vez de um spinner genérico no centro.

export const HomeSkeleton = () => (
  <div className="space-y-6 pt-3 animate-fade-in">
    <Skeleton className="h-40 w-full rounded-[28px] -mx-4 md:-mx-6 -mt-3" style={{ width: "calc(100% + 2rem)" }} />
    <div className="grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
    <Skeleton className="h-16 rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <div className="flex gap-3 overflow-hidden">
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-52 w-36 rounded-2xl flex-shrink-0" />)}
    </div>
  </div>
);

export const WorkoutSkeleton = () => (
  <div className="space-y-4 pt-3 animate-fade-in">
    <div className="space-y-2">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-7 w-2/3 rounded" />
      <Skeleton className="h-4 w-1/3 rounded" />
    </div>
    <Skeleton className="h-20 rounded-2xl" />
    {[0, 1].map(b => (
      <div key={b} className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        {[0, 1].map(e => (
          <div key={e} className="flex items-center gap-3 pl-3">
            <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const CatalogSkeleton = () => (
  <div className="px-4 pt-3 space-y-6 animate-fade-in">
    {[0, 1, 2].map(row => (
      <div key={row} className="space-y-2.5">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-64 w-44 rounded-2xl flex-shrink-0" />)}
        </div>
      </div>
    ))}
  </div>
);

export const EvolutionSkeleton = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
    <Skeleton className="h-14 rounded-2xl" />
    <div className="space-y-2">
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-2.5 animate-fade-in">
    {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
  </div>
);
