import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -30%, rgba(79, 70, 229, 0.14), transparent), radial-gradient(ellipse 55% 45% at 100% 40%, rgba(14, 165, 233, 0.1), transparent)",
        }}
      />
      <Suspense
        fallback={
          <div className="h-40 w-full max-w-md animate-pulse rounded-3xl bg-slate-200/60" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
