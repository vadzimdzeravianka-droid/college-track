import { getColleges } from "@/actions/college";
import { DashboardClient } from "@/components/dashboard-client";
import { StatsOverview } from "@/components/stats-overview";
import { CollegeFormNew } from "@/components/college-form-new";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 w-full bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold truncate">College Track</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={handleLogout}>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold">College Applications</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track your progress and never miss a deadline
            </p>
          </div>
          {/* Desktop: Regular button */}
          <div className="hidden sm:block flex-shrink-0">
            <CollegeFormNew />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive mb-6 border border-destructive/20">
            {error}
          </div>
        )}

        {colleges && colleges.length > 0 && <StatsOverview colleges={colleges} />}
        {colleges && <DashboardClient colleges={colleges} />}
      </main>

      {/* Mobile: Floating Action Button */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <CollegeFormNew variant="fab" />
      </div>
    </div>
  );
}
