"use client";

import { Chrome } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  return (
    <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })} type="button">
      <Chrome className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}
