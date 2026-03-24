import { getCollegeById, deleteCollege } from "@/actions/college";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, CategoryBadge, StrategyBadge } from "@/components/status-badge";
import { ChecklistForm } from "@/components/checklist-form";
import { PortalCredentials } from "@/components/portal-credentials";
import { CollegeEditButton } from "@/components/college-edit-button";
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
      <div className="min-h-svh bg-background p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20">
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
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 w-full bg-background border-b">
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

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-32 lg:pb-8">
        <div className="mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold break-words">{college.name}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={college.status} />
              <CategoryBadge category={college.category} />
              <StrategyBadge strategy={college.strategy} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mobile: Checklist first */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ChecklistForm checklist={college.checklist} collegeId={college.id} />
              </CardContent>
            </Card>
          </div>

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
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p>{college.location}</p>
                    </div>
                  </div>
                )}

                {college.major && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Intended Major</p>
                      <p>{college.major}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Application Deadline</p>
                    <p>{formatDate(college.deadlineApp)}</p>
                  </div>
                </div>

                {college.deadlineFinaid && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Financial Aid Deadline</p>
                      <p>{formatDate(college.deadlineFinaid)}</p>
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
                  <p className="text-muted-foreground whitespace-pre-wrap">{college.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Desktop: Action buttons */}
            <div className="hidden lg:flex gap-2">
              <CollegeEditButton college={college} size="sm" />
              <form action={handleDelete.bind(null, college.id)}>
                <Button variant="destructive" size="sm" type="submit">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete College
                </Button>
              </form>
            </div>
          </div>

          {/* Desktop: Sidebar - Checklist */}
          <div className="hidden lg:block lg:col-span-1">
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

      {/* Mobile: Fixed bottom action buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-2">
        <CollegeEditButton college={college} className="w-full" />
        <form action={handleDelete.bind(null, college.id)}>
          <Button variant="destructive" type="submit" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete College
          </Button>
        </form>
      </div>
    </div>
  );
}
