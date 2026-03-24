type College = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "WAITLISTED" | "ACCEPTED" | "DECLINED";
};

export function StatsOverview({ colleges }: { colleges: College[] }) {
  const stats = {
    total: colleges.length,
    notStarted: colleges.filter((c) => c.status === "NOT_STARTED").length,
    inProgress: colleges.filter((c) => c.status === "IN_PROGRESS").length,
    submitted: colleges.filter((c) => c.status === "SUBMITTED").length,
    accepted: colleges.filter((c) => c.status === "ACCEPTED").length,
  };

  return (
    <>
      {/* Mobile: Compact inline stats */}
      <div className="flex md:hidden items-center justify-between bg-white rounded-lg p-3 shadow-sm border mb-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-600">Total</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-600">In Progress</p>
            <p className="text-xl font-bold text-blue-700">{stats.inProgress}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-600">Done</p>
            <p className="text-xl font-bold text-green-700">{stats.submitted + stats.accepted}</p>
          </div>
        </div>
      </div>

      {/* Desktop: Full grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-slate-600">Not Started</p>
          <p className="text-2xl font-bold text-gray-700">{stats.notStarted}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-slate-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-slate-600">Submitted</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-sm text-slate-600">Accepted</p>
          <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
        </div>
      </div>
    </>
  );
}
