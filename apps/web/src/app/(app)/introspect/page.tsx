"use client";

import { treaty } from "@elysiajs/eden";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Page() {
  const [dbURL, setDBURL] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: responseError } = await api.introspect.post({
        connectionString: dbURL,
      });

      if (responseError) {
        const errorMessage =
          responseError?.value?.error?.message ||
          responseError?.value?.message ||
          responseError?.message ||
          "An error occurred";
        setError(errorMessage);
        console.error("Error response:", responseError);
      } else {
        console.log("Introspection result: ", data);
        setError(null);
      }
    } catch (err: any) {
      const errorMessage =
        err?.value?.error?.message ||
        err?.error?.message ||
        err?.message ||
        "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ maxWidth: 600, margin: "auto" }}>
      <CardHeader>
        <CardTitle>Enter DB URL</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="DBUrl">URL:</Label>

            <Input
              id="DBUrl"
              type="text"
              placeholder="Enter your connection string for postgres"
              onChange={(e) => setDBURL(e.target.value)}
              required
              disabled={loading}
            />
            {error && (
              <div className="mt-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
