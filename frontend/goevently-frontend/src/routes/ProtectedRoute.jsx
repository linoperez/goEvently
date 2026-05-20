import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

function normalizeRole(role) {
  return String(role || "")
    .replace("ROLE_", "")
    .trim()
    .toUpperCase();
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireAuth = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const loggedIn = Boolean(isAuthenticated || user);
  const currentRole = normalizeRole(user?.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (requireAuth && !loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRoleAccess =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(currentRole);

  if (!hasRoleAccess) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl py-16">
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl font800 text-red-600">
              !
            </div>

            <h1 className="mt-6 text-3xl font800 tracking-[-0.04em] text-[#0b1533]">
              Access denied
            </h1>

            <p className="mt-3 text-sm font600 leading-6 text-[#66708a]">
              You do not have permission to access this page.
            </p>

            <div className="mt-7 flex justify-center">
              <Button onClick={() => navigate("/events")}>Go to Explore</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return children;
}