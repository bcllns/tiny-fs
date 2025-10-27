import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 py-20">
        <header className="space-y-6 text-center sm:text-left">
          <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-4 py-1 text-sm font-medium text-[#4c1d95]">
            Secure file sharing powered by Supabase
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-[#4c1d95] sm:text-5xl">
            Share files with confidence.
          </h1>
          <p className="max-w-2xl text-lg text-[#6b21a8]">
            Tiny Box combines Supabase Auth and Storage with a clean Next.js interface so your team can upload,
            organize, and share files in seconds. Time-boxed verification codes keep access under control while
            public links make broadcasting effortless.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {user ? (
              <>
                <Button asChild className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#e2d9ff] text-[#4c1d95] hover:bg-[#f5f0ff]"
                >
                  <Link href="#features">Explore features</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                  <Link href="/sign-up">Create an account</Link>
                </Button>
                <Button asChild variant="ghost" className="text-[#4c1d95] hover:bg-[#f5f0ff]">
                  <Link href="/sign-in">Sign in with OTP</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <section id="features" className="grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "OTP email authentication",
              description:
                "Sign in securely without passwords using Supabase email one-time passcodes. Codes expire automatically to keep accounts safe.",
            },
            {
              title: "Public or private access",
              description:
                "Toggle file visibility in one click. Generate public URLs or unique private share links with expirations.",
            },
            {
              title: "Email sharing shortcuts",
              description:
                "Compose prefilled emails with share links or copy them instantly to your clipboard for quick messaging.",
            },
            {
              title: "Supabase Storage uploads",
              description:
                "Files are stored in your Supabase project so you remain in control of access policies and retention.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="space-y-2 rounded-2xl border border-[#e2d9ff] bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#4c1d95]">{feature.title}</h3>
              <p className="text-sm text-[#6b21a8]">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
