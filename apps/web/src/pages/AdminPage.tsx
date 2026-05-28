import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Files, HardDrive, Users } from "lucide-react";
import { Loading } from "../components/Loading";
import { SelectField } from "../components/Field";
import { StatCard } from "../components/StatCard";
import { useApi } from "../lib/api-context";
import { formatBytes } from "../lib/utils";
import type { UserRole } from "@launchkit/contracts";

export function AdminPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const metrics = useQuery({ queryKey: ["admin", "metrics"], queryFn: api.getAdminMetrics });
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: api.listUsers });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.updateUserRole(id, role),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["me"] })
      ]);
    }
  });

  if (metrics.isLoading || users.isLoading) {
    return <Loading label="Loading admin" />;
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-medium text-brand">Operations</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Admin</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Users" value={String(metrics.data?.users ?? 0)} />
        <StatCard icon={Files} label="Files" value={String(metrics.data?.files ?? 0)} />
        <StatCard
          icon={HardDrive}
          label="Storage"
          value={formatBytes(metrics.data?.storageBytes ?? 0)}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-paper shadow-panel">
        <div className="border-b border-line p-4">
          <h2 className="text-xl font-semibold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-field text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.data?.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3 text-muted">{user.displayName ?? "Not set"}</td>
                  <td className="px-4 py-3">
                    <SelectField
                      aria-label={`Role for ${user.email}`}
                      label="Role"
                      className="w-36"
                      value={user.role}
                      onChange={(event) =>
                        updateRole.mutate({ id: user.id, role: event.target.value as UserRole })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </SelectField>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
