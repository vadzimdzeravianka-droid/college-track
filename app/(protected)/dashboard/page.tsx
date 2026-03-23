import { getColleges } from "@/actions/college";
import { DashboardClient } from "@/components/dashboard-client";
import { StatsOverview } from "@/components/stats-overview";
import { CollegeForm } from "@/components/college-form";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function handleLogout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("is_authorized");
  redirect("/login");
}

export default async function DashboardPage() {
  const { colleges, error } = await getColleges();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">College Track</h1>
          <form action={handleLogout}>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">College Applications</h2>
            <p className="text-slate-600 mt-1">
              Track your progress and never miss a deadline
            </p>
          </div>
          <CollegeForm />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800 mb-6">
            {error}
          </div>
        )}

        {colleges && colleges.length > 0 && <StatsOverview colleges={colleges} />}
        {colleges && <DashboardClient colleges={colleges} />}
      </main>
    </div>
  );
}
