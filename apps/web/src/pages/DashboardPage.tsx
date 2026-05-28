import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FileUp, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Loading } from "../components/Loading";
import { StatCard } from "../components/StatCard";
import { useApi } from "../lib/api-context";

export function DashboardPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["me"], queryFn: api.getMe });
  const files = useQuery({ queryKey: ["files"], queryFn: api.listFiles });
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(profile.data?.displayName ?? "");
  }, [profile.data?.displayName]);

  const updateProfile = useMutation({
    mutationFn: () => api.updateMe({ displayName: displayName.trim() || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });

  if (profile.isLoading || files.isLoading) {
    return <Loading label="Preparing dashboard" />;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate();
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-medium text-brand">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Database} label="Database profile" value={profile.data?.role ?? "user"} />
        <StatCard icon={FileUp} label="Files uploaded" value={String(files.data?.length ?? 0)} />
        <StatCard icon={ShieldCheck} label="Auth provider" value="Cognito ready" />
      </section>

      <section className="rounded-lg border border-line bg-paper p-5 shadow-panel">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted">This record is created automatically on first API access.</p>
        </div>
        <form onSubmit={submit} className="grid max-w-xl gap-4">
          <Field label="Email" value={profile.data?.email ?? ""} disabled />
          <Field
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
          />
          <div>
            <Button disabled={updateProfile.isPending} type="submit">
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
