import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { Loading } from "./components/Loading";
import { Shell } from "./components/Shell";
import { ApiProvider } from "./lib/api-context";
import { AuthProvider, useAuth } from "./lib/auth";
import type { RuntimeConfig } from "./lib/runtime-config";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FilesPage } from "./pages/FilesPage";

const queryClient = new QueryClient();

export function App({ config }: { config: RuntimeConfig }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={config}>
        <ApiProvider config={config}>
          <RouterProvider router={router} />
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function ProtectedRoute() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <Loading />;
  }

  if (auth.status === "anonymous") {
    return <Navigate to="/auth" replace />;
  }

  return <Shell />;
}

function AdminRoute() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <Loading />;
  }

  if (auth.user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminPage />;
}

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "files", element: <FilesPage /> },
      { path: "admin", element: <AdminRoute /> }
    ]
  }
]);
