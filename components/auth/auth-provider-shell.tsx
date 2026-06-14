import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/contexts/AuthContext";

export async function AuthProviderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <AuthProvider initialSession={session}>{children}</AuthProvider>
  );
}
