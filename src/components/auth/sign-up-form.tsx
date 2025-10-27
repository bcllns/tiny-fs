'use client';

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

type Stage = "form" | "confirm";

export const SignUpForm = ({ redirectTo }: { redirectTo?: string }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });
  const [stage, setStage] = useState<Stage>("form");
  const [emailForConfirm, setEmailForConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailRedirectTo = useMemo(() => {
    const target = redirectTo ?? "/dashboard";
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      return `${origin}/auth/callback?redirect=${encodeURIComponent(target)}`;
    }
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envUrl) return undefined;
    return `${envUrl.replace(/\/$/, "")}/auth/callback?redirect=${encodeURIComponent(target)}`;
  }, [redirectTo]);

  const handleSubmit = (values: SignUpValues) => {
    startTransition(async () => {
      const displayName = `${values.firstName} ${values.lastName}`.trim();
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            display_name: displayName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailForConfirm(values.email);
      setStage("confirm");
      toast.success("Check your email to confirm your account.");
    });
  };

  const handleResend = () => {
    if (!emailForConfirm) return;
    startTransition(async () => {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailForConfirm,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Confirmation email resent.");
    });
  };

  if (stage === "confirm") {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#4c1d95]">Confirm your email</h2>
          <p className="text-sm text-[#6b21a8]">
            We sent a confirmation link to <span className="font-medium">{emailForConfirm}</span>. Click the link to
            finish creating your account and you&apos;ll be signed in automatically.
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full" onClick={handleResend} disabled={isPending} type="button">
            {isPending ? "Resending..." : "Resend email"}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-[#4c1d95] hover:bg-[#f5f0ff]"
            onClick={() => router.push("/sign-in")}
            type="button"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
        {form.formState.errors.firstName ? (
          <p className="text-sm text-[#b91c1c]">{form.formState.errors.firstName.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
        {form.formState.errors.lastName ? (
          <p className="text-sm text-[#b91c1c]">{form.formState.errors.lastName.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-[#b91c1c]">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
};
