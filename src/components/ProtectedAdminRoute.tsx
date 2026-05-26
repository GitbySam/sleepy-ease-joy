import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (mounted) setStatus("denied");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionData.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) setStatus(!error && data ? "ok" : "denied");
    };
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Defer any Supabase calls outside the auth callback to avoid deadlock
      setTimeout(() => {
        if (mounted) check();
      }, 0);
    });
    check();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (status === "denied") return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}