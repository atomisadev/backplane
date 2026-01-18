"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const { createProject } = useProjects();
  const [formData, setFormData] = useState({
    name: "",
    dbType: "postgres" as "postgres" | "mysql",
    connectionUri: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const uri = formData.connectionUri.trim();

    if (formData.dbType === "postgres") {
      if (!(uri.startsWith("postgresql://") || uri.startsWith("postgres://"))) {
        setError(
          'Postgres connection strings must start with "postgresql://" or "postgres://"',
        );
        return;
      }
    } else {
      if (!(uri.startsWith("mysql://") || uri.startsWith("mysql2://"))) {
        setError(
          'MySQL connection strings must start with "mysql://" or "mysql2://"',
        );
        return;
      }
    }

    try {
      await createProject.mutateAsync({
        name: formData.name,
        db_type: formData.dbType,
        connection_uri: uri,
      });
      setOpen(false);
      setFormData({ name: "", dbType: "postgres", connectionUri: "" });
    } catch (err) {
      setError("Failed to create project. Check the connection string.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] gap-6">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Connect a new database to Backplane.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <div className="grid grid-cols-2 gap-3">
              {(["postgres", "mysql"] as const).map((type) => (
                <div
                  key={type}
                  onClick={() => setFormData({ ...formData, dbType: type })}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50 flex flex-col items-center gap-2 text-center",
                    formData.dbType === type
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-muted/10",
                  )}
                >
                  <Database
                    className={cn(
                      "size-5",
                      formData.dbType === type
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span className="text-xs font-medium capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uri">Connection String</Label>
            <Input
              id="uri"
              type="password"
              placeholder={
                formData.dbType === "postgres"
                  ? "postgresql://user:password@host:5432/db"
                  : "mysql://user:password@host:3306/db"
              }
              value={formData.connectionUri}
              onChange={(e) => {
                setFormData({ ...formData, connectionUri: e.target.value });
                setError(null);
              }}
              required
              className="font-mono text-xs bg-muted/30"
            />
            {error ? (
              <p className="text-[10px] text-destructive font-medium">
                {error}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Credentials are encrypted with AES-256-GCM.
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="w-full sm:w-auto"
            >
              {createProject.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
