import { ShieldCheck } from "lucide-react";

import { GoogleSignInButton } from "@/components/forms/google-sign-in-button";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f766e] p-8 text-white lg:p-12">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Attendance Management</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
            Taze Creative keeps attendance, leave approvals, and team visibility in one place.
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/75">
            Employees can check in, request leave, and review their calendar. Admins can manage approvals, attendance
            overrides, analytics, and exports.
          </p>
        </Card>

        <Card className="rounded-[2rem] p-8 lg:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-muted-foreground">Secure Access</p>
          <h2 className="mt-2 text-3xl font-semibold">Sign in with your company Google account</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Only pre-approved Taze Creative email addresses can enter the dashboard. Your role is assigned by admin.
          </p>

          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          <div className="mt-6 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            Example seeded accounts:
            <br />
            `raghav@tazecreative.com`, `aisha@tazecreative.com`, `neha@tazecreative.com`
          </div>
        </Card>
      </div>
    </main>
  );
}
