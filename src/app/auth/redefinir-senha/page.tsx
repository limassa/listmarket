import { RedefinirSenhaForm } from "@/app/auth/redefinir-senha/redefinir-senha-form";
import { Suspense } from "react";

export default function RedefinirSenhaPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden px-4 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -30%, rgba(79, 70, 229, 0.12), transparent)",
        }}
      />
      <Suspense
        fallback={
          <div className="mx-auto mt-24 h-32 w-full max-w-md animate-pulse rounded-3xl bg-slate-200/60" />
        }
      >
        <RedefinirSenhaForm />
      </Suspense>
    </div>
  );
}
