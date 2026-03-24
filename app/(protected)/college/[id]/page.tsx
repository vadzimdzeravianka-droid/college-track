import { getCollegeById, deleteCollege } from "@/actions/college";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, CategoryBadge, StrategyBadge } from "@/components/status-badge";
import { ChecklistForm } from "@/components/checklist-form";
import { PortalCredentials } from "@/components/portal-credentials";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, MapPin, GraduationCap, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

async function handleDelete(id: string) {
  "use server";
  const result = await deleteCollege(id);
  if (result.success) {
    redirect("/dashboard");
  }
}

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { college, error } = await getCollegeById(id);

  if (error || !college) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            {error || "College not found"}
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 break-words">{college.name}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={college.status} />
            <CategoryBadge category={college.category} />
            <StrategyBadge strategy={college.strategy} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {college.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Location</p>
                      <p className="text-slate-900">{college.location}</p>
                    </div>
                  </div>
                )}

                {college.major && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Intended Major</p>
                      <p className="text-slate-900">{college.major}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Application Deadline</p>
                    <p className="text-slate-900">{formatDate(college.deadlineApp)}</p>
                  </div>
                </div>

                {college.deadlineFinaid && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Financial Aid Deadline</p>
                      <p className="text-slate-900">{formatDate(college.deadlineFinaid)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portal Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Portal Access</CardTitle>
              </CardHeader>
              <CardContent>
                <PortalCredentials
                  portalUrl={college.portalUrl}
                  portalUser={college.portalUser}
                  portalPassword={college.portalPassword}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            {college.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{college.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Delete Button */}
            <form action={handleDelete.bind(null, college.id)}>
              <Button variant="destructive" size="sm" type="submit">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete College
              </Button>
            </form>
          </div>

          {/* Sidebar - Checklist */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ChecklistForm checklist={college.checklist} collegeId={college.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
