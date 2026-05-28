import { Boxes, Files, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "./Button";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

export function Shell() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-paper px-5 py-6 lg:block">
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">LaunchKit</p>
            <p className="text-xs text-muted">Deployable starter stack</p>
          </div>
        </div>
        <nav className="grid gap-1">
          <ShellLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <ShellLink to="/files" icon={Files} label="Files" />
          {auth.user?.role === "admin" ? (
            <ShellLink to="/admin" icon={ShieldCheck} label="Admin" />
          ) : null}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-line bg-field p-4">
          <p className="text-sm font-semibold text-ink">Dev stack online</p>
          <p className="mt-1 text-xs leading-5 text-muted">Core services are responding in this environment.</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Signed in as</p>
              <p className="break-all text-sm font-semibold text-ink">{auth.user?.email}</p>
            </div>
            <Button variant="secondary" onClick={() => void auth.signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            <MobileLink to="/dashboard" label="Dashboard" />
            <MobileLink to="/files" label="Files" />
            {auth.user?.role === "admin" ? <MobileLink to="/admin" label="Admin" /> : null}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ShellLink({
  to,
  icon: Icon,
  label
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition hover:bg-field hover:text-ink",
          isActive && "bg-soft text-brand"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function MobileLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-2 text-sm font-medium text-muted",
          isActive && "bg-soft text-brand"
        )
      }
    >
      {label}
    </NavLink>
  );
}
