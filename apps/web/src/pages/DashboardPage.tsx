import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  FileUp,
  Route,
  ShieldCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Loading } from "../components/Loading";
import { StatCard } from "../components/StatCard";
import { useApi } from "../lib/api-context";
import { formatBytes, formatDate } from "../lib/utils";

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

  const storageBytes = files.data?.reduce((total, file) => total + file.sizeBytes, 0) ?? 0;
  const firstName = profile.data?.displayName?.split(" ")[0] ?? "there";
  const readinessItems = [
    { label: "Authentication", detail: "Cognito session accepted", icon: ShieldCheck },
    { label: "HTTP API", detail: "JWT route reached", icon: Route },
    { label: "Database", detail: profile.data ? "Profile row synced" : "Waiting", icon: Database },
    { label: "Storage", detail: `${files.data?.length ?? 0} file records`, icon: Cloud }
  ];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate();
  }

  return (
    <div className="grid gap-6">
      <header className="overflow-hidden rounded-lg border border-line bg-paper shadow-panel">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px] lg:p-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-soft px-3 py-1 text-sm font-medium text-brand">
              <Activity className="h-4 w-4" />
              Dev environment
            </div>
            <h1 className="text-3xl font-semibold text-ink md:text-4xl">Welcome back, {firstName}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Your starter workspace is connected across identity, API, storage, and Postgres.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-field p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Readiness</p>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand">Active</span>
            </div>
            <div className="grid gap-2">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-md bg-paper px-3 py-2">
                  <item.icon className="h-4 w-4 text-brand" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-muted">{item.detail}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 text-brand" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          label="Current role"
          value={profile.data?.role ?? "user"}
          detail="From the profile record"
          tone="brand"
        />
        <StatCard
          icon={FileUp}
          label="Files uploaded"
          value={String(files.data?.length ?? 0)}
          detail={formatBytes(storageBytes)}
          tone="blue"
        />
        <StatCard
          icon={ShieldCheck}
          label="Account created"
          value={profile.data ? formatDate(profile.data.createdAt) : "-"}
          detail="Synced from Cognito"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-line bg-paper p-5 shadow-panel">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-soft text-brand">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Profile</h2>
              <p className="text-sm text-muted">Stored in Postgres and editable through the API.</p>
            </div>
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
        </div>

        <div className="rounded-lg border border-line bg-paper p-5 shadow-panel">
          <h2 className="text-xl font-semibold">Next checkpoints</h2>
          <div className="mt-4 grid gap-3">
            {["Upload and download a file", "Promote an admin user", "Run a DB migration"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-line bg-field px-3 py-3">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
