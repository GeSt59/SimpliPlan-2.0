import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-8 px-6 py-10">
        <div className="relative aspect-square w-full max-w-[307px] overflow-hidden rounded-3xl border-2 border-white bg-brand-blue shadow-md">
          <Image src="/logo.jpg" alt="SimpliPlan Logo" fill className="object-cover" priority />
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">SimpliPlan 2.0</h1>

          <p className="font-body text-lg text-brand-blue">
            Clevere Planung und Organisation für Clubabende und erfolgreiche Activities
          </p>

          <div className="flex flex-col gap-1">
            <p className="font-body text-lg text-brand-blue">Kontakt:</p>
            <a href="mailto:office@toolies.eu" className="font-body text-base text-brand-blue">
              office@toolies.eu
            </a>
            <a
              href="https://simpliplan.webnode.page/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-base text-brand-blue"
            >
              https://simpliplan.webnode.page/
            </a>
          </div>
        </div>

        <Link
          href="/activities"
          className="flex w-full items-center justify-center rounded-md bg-brand-blue py-3 font-heading font-bold uppercase tracking-wide text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:bg-brand-blue/90"
        >
          OK
        </Link>
      </div>
    </main>
  );
}
