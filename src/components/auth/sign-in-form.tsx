'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Provide a valid email"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Enter the 6-digit code")
    .max(6, "Enter the 6-digit code")
    .regex(/^[0-9]{6}$/, "Code must be 6 digits"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type Stage = "request" | "verify";

export const SignInForm = ({ redirectTo }: { redirectTo?: string }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });
  const [stage, setStage] = useState<Stage>("request");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRequest = (values: EmailFormValues) => {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        const message = /not\s+found/i.test(error.message)
          ? "We couldn't find an account for that email. Create one before signing in."
          : error.message;
        toast.error(message);
        return;
      }

      setEmailForOtp(values.email);
      setStage("verify");
      otpForm.reset();
      toast.success("Enter the 6-digit code sent to your email.");
    });
  };

  const handleVerify = (values: OtpFormValues) => {
    startTransition(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: emailForOtp,
        token: values.otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Signed in successfully");
      const target = redirectTo ?? "/dashboard";
      router.push(target);
      router.refresh();
    });
  };

  const handleResend = () => {
    if (!emailForOtp) {
      toast.error("Enter your email to request a code first.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailForOtp,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("New code sent. Check your inbox.");
    });
  };

  if (stage === "verify") {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-[#4c1d95]">Verify your email</h2>
          <p className="text-sm text-[#6b21a8]">
            Enter the 6-digit code we sent to <span className="font-medium">{emailForOtp}</span>.
          </p>
        </div>
        <form
          className="space-y-6"
          onSubmit={otpForm.handleSubmit(handleVerify)}
        >
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              autoComplete="one-time-code"
              {...otpForm.register("otp")}
            />
            {otpForm.formState.errors.otp ? (
              <p className="text-sm text-[#b91c1c]">{otpForm.formState.errors.otp.message}</p>
            ) : null}
          </div>
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Verifying..." : "Verify and sign in"}
          </Button>
        </form>
        <div className="flex flex-col gap-2 text-sm text-[#6b21a8]">
          <button
            className="text-left font-medium text-[#4c1d95] hover:underline"
            disabled={isPending}
            onClick={handleResend}
            type="button"
          >
            Resend code
          </button>
          <button
            className="text-left text-[#6b21a8] hover:underline"
            disabled={isPending}
            onClick={() => {
              setStage("request");
              setEmailForOtp("");
              emailForm.reset();
            }}
            type="button"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={emailForm.handleSubmit(handleRequest)}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(emailForm.formState.errors.email)}
          {...emailForm.register("email")}
        />
        {emailForm.formState.errors.email ? (
          <p className="text-sm text-[#b91c1c]">{emailForm.formState.errors.email.message}</p>
        ) : null}
      </div>
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Sending code..." : "Send sign-in code"}
      </Button>
    </form>
  );
};
