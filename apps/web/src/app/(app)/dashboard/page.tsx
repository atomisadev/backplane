"use client";

import { useProjects } from "@/hooks/use-project";
import { CreateProjectSheet } from "./_components/create-project-sheet";
import { ProjectCard } from "./_components/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Dashboard() {
  const { projects } = useProjects();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col p-6 md:p-10 bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your database connections.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CreateProjectSheet />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer border border-border/50 transition-opacity hover:opacity-80">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {session?.user?.name ? (
                      session.user.name.charAt(0).toUpperCase()
                    ) : (
                      <User className="size-4 text-muted-foreground" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-normal">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {projects.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
            ))}
          </div>
        ) : projects.data && projects.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.data.map((project: any) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                dbType={project.dbType}
                createdAt={project.createdAt}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/10 p-8 text-center animate-in fade-in-50">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Database className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mb-4 text-sm text-muted-foreground max-w-sm">
              Create your first project to start managing your database schemas
              and queries directly from the Backplane.
            </p>
            <CreateProjectSheet />
          </div>
        )}
      </div>
    </div>
  );
}
