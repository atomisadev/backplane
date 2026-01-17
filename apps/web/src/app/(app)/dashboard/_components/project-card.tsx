"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  id: string;
  name: string;
  dbType: "postgres" | "mysql";
  createdAt: string;
}

export function ProjectCard({ id, name, dbType, createdAt }: ProjectCardProps) {
  return (
    <Link href={`/project/${id}`} className="group block h-full">
      <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Database className="size-4" />
              </div>
              <CardDescription className="uppercase tracking-wider text-[10px] font-bold">
                {dbType}
              </CardDescription>
            </div>
            <ArrowRight className="size-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-primary" />
          </div>
          <CardTitle className="mt-4 text-xl font-medium leading-none tracking-tight">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Created {new Date(createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
