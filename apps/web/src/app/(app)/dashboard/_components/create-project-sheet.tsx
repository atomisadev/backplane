"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Plus, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateProjectSheet() {
  const [open, setOpen] = useState(false);
  const { createProject } = useProjects();
  const [formData, setFormData] = useState({
    name: "",
    dbType: "postgres" as "postgres" | "mysql",
    connectionUri: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      name: formData.name,
      db_type: formData.dbType,
      connection_uri: formData.connectionUri,
    });
    setOpen(false);
    setFormData({ name: "", dbType: "postgres", connectionUri: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Project
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Create Project</SheetTitle>
            <SheetDescription>
              Connect a new database to Backplane.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome App"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-muted/30"
              />
            </div>

            <div className="space-y-2">
              <Label>Database Type</Label>
              <div className="grid grid-cols-2 gap-4">
                {(["postgres", "mysql"] as const).map((type) => (
                  <div
                    key={type}
                    onClick={() => setFormData({ ...formData, dbType: type })}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                      formData.dbType === type
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/30",
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Database
                        className={cn(
                          "size-6",
                          formData.dbType === type
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-medium capitalize">
                        {type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uri">Connection String</Label>
              <Input
                id="uri"
                type="password"
                placeholder="postgresql://user:password@host..."
                value={formData.connectionUri}
                onChange={(e) =>
                  setFormData({ ...formData, connectionUri: e.target.value })
                }
                required
                className="font-mono text-xs bg-muted/30"
              />
              <p className="text-[10px] text-muted-foreground">
                Credentials are encrypted with AES-256-GCM before storage.
              </p>
            </div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create Project
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
