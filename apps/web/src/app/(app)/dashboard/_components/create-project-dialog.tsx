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
import { Plus, Database, Loader2, Link, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const { createProject } = useProjects();
  const [connectionMode, setConnectionMode] = useState<"uri" | "simple">("uri");
  const [formData, setFormData] = useState({
    name: "",
    dbType: "postgres" as "postgres" | "mysql",
    connectionUri: "",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ssl: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let uri = "";
    if (connectionMode === "uri") {
      uri = formData.connectionUri.trim();

      if (formData.dbType === "postgres") {
        if (
          !(uri.startsWith("postgresql://") || uri.startsWith("postgres://"))
        ) {
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
    } else {
      const { host, port, database, username, password, ssl } = formData;
      const protocol = formData.dbType === "postgres" ? "postgresql" : "mysql";
      const sslQuery = ssl
        ? formData.dbType === "postgres"
          ? "?sslmode=require"
          : "?ssl=true"
        : "";
      uri = `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}${sslQuery}`;
    }

    try {
      await createProject.mutateAsync({
        name: formData.name,
        db_type: formData.dbType,
        connection_uri: uri,
      });
      setOpen(false);
      setFormData({
        name: "",
        dbType: "postgres",
        connectionUri: "",
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        ssl: true,
      });
    } catch (err) {
      setError("Failed to create project. Check the connection details.");
    }
  };

  const handleDbTypeChange = (type: "postgres" | "mysql") => {
    setFormData((prev) => ({
      ...prev,
      dbType: type,
      port: type === "postgres" ? "5432" : "3306",
    }));
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
                  onClick={() => handleDbTypeChange(type)}
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
            <Label>Connection Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["uri", "simple"] as const).map((mode) => (
                <div
                  key={mode}
                  onClick={() => setConnectionMode(mode)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50 flex flex-col items-center gap-2 text-center",
                    connectionMode === mode
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-muted/10",
                  )}
                >
                  {mode === "uri" ? (
                    <Link
                      className={cn(
                        "size-5",
                        connectionMode === mode
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  ) : (
                    <Settings2
                      className={cn(
                        "size-5",
                        connectionMode === mode
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  )}
                  <span className="text-xs font-medium capitalize">
                    {mode === "uri" ? "Connection String" : "Simple Connection"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {connectionMode === "uri" ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  required
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder={formData.dbType === "postgres" ? "5432" : "3306"}
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: e.target.value })
                  }
                  required
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input
                  id="database"
                  placeholder="postgres"
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                  required
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="postgres"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-muted/30"
                />
              </div>
              <div className="flex items-center gap-2 col-span-2 py-1">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={formData.ssl}
                  onChange={(e) =>
                    setFormData({ ...formData, ssl: e.target.checked })
                  }
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="ssl" className="text-xs cursor-pointer">
                  Enable SSL (Required for most cloud databases)
                </Label>
              </div>
              <div className="col-span-2">
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
            </div>
          )}

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
