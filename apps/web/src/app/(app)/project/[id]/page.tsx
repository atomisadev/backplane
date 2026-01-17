"use client";

import { useProject } from "@/hooks/use-project";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Database, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProjectView() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col p-10 bg-background space-y-8">
        <div className="max-w-5xl w-full mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-semibold text-destructive">
          Project not found
        </h2>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="border-b bg-muted/10 pb-8 pt-10 px-6 md:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <Button
            variant="ghost"
            className="mb-6 -ml-4 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 uppercase">
                  {project.dbType}
                </span>
              </div>
              <p className="text-muted-foreground font-mono text-xs mt-2 opacity-60">
                ID: {project.id}
              </p>
            </div>

            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground border-dashed">
            <Database className="size-10 mb-4 opacity-20" />
            <p>Project configuration loaded.</p>
            <p className="text-sm">Database connection established securely.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
