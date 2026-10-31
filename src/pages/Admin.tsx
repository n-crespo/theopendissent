import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SEO } from "../components/ui/Seo";

export const Admin = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col gap-3 pb-10">
      <SEO title="Admin" description="Admin tools" />
      <h1 className="my-2 text-center text-xl font-bold text-stone-900 tracking-tight">
        Admin
      </h1>
      <p className="text-center text-sm text-stone-500">
        You have admin access.
      </p>
    </div>
  );
};
