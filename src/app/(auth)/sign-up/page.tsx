import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create account | Tiny Box",
};

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
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
          <h1 className="text-2xl font-semibold text-[#4c1d95]">Create your Tiny Box account</h1>
          <p className="text-sm text-[#6b21a8]">
            Enter your details to get access. We&apos;ll send a confirmation email so you can activate your account.
          </p>
        </div>
        <SignUpForm redirectTo={redirectTo} />
        <p className="text-center text-sm text-[#6b21a8]">
          Already registered?{" "}
          <Link href="/sign-in" className="font-medium text-[#4c1d95] hover:underline">
            Sign in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
