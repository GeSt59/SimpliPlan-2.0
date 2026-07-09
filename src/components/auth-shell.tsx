import Image from "next/image";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="relative aspect-square w-56 overflow-hidden rounded-2xl shadow-md">
          <Image src="/logo.jpg" alt="SimpliPlan Logo" fill priority className="object-cover" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-brand-blue">{title}</h1>

        {children}
      </div>
    </main>
  );
}
