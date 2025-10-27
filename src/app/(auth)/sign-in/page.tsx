import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in | Tiny Box",
};

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : undefined;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#e2d9ff] bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[#4c1d95]">Welcome back</h1>
          <p className="text-sm text-[#6b21a8]">
            Sign in with the email you used to register. We&apos;ll send a 6-digit verification code to your inbox.
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
        <div className="text-center text-sm text-[#6b21a8]">
          <span className="mr-1">Need an account?</span>
          <Button asChild variant="ghost" className="text-[#4c1d95] hover:bg-[#f5f0ff]">
            <Link href="/sign-up">Create one</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
