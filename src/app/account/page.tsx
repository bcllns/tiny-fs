import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/account");
  }

  const rawMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (typeof rawMetadata.full_name === "string" && rawMetadata.full_name.trim()) ||
    (typeof rawMetadata.name === "string" && rawMetadata.name.trim()) ||
    (typeof rawMetadata.display_name === "string" && rawMetadata.display_name.trim()) ||
    user.email ||
    "My account";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-[#4c1d95]">My Account</h1>
            <p className="text-sm text-[#6b21a8]">
              Manage your Tiny Box profile and account preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#4c1d95] hover:text-[#3b2aa3]"
            >
              Back to dashboard
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="rounded-2xl border border-[#e2d9ff] bg-[#faf5ff]/60 p-8 text-center shadow-sm">
          <p className="text-xl font-semibold text-[#4c1d95]">Hi, {displayName}!</p>
          <p className="mt-2 text-sm text-[#6b21a8]">
            Account management tools are coming soon. In the meantime, you can return to your dashboard or sign
            out above.
          </p>
        </section>
      </div>
    </main>
  );
}
