import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 h-full">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 md:py-8 pt-18">
          {children}
        </div>
      </main>
    </div>
  );
}
