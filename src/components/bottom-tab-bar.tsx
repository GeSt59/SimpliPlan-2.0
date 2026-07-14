"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CirclePlus, CircleUser, List, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tab = {
  key: string;
  label: string;
  href: string;
  icon: typeof Calendar;
  isActive: (pathname: string) => boolean;
};

const DEFAULT_LABELS = {
  tab1: "Activities",
  tab2: "Lions",
  tab3: "Activity",
  tab4: "Kategorien",
  tab5: "Profil",
};

export function BottomTabBar() {
  const pathname = usePathname();

  const [session, setSession] = useState<boolean>(false);
  const [ready, setReady] = useState(false);
  const [isAdminOrSu, setIsAdminOrSu] = useState(false);
  const [labels, setLabels] = useState(DEFAULT_LABELS);

  useEffect(() => {
    let active = true;

    async function loadRole(authUserId: string) {
      const { data: userRow } = await supabase
        .from("users")
        .select("admin, su, verein")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (!active) return;

      const admin = !!userRow?.admin;
      const su = !!userRow?.su;
      setIsAdminOrSu(admin || su);

      const vereinId = su ? undefined : userRow?.verein?.[0];

      if (!vereinId) {
        setLabels(DEFAULT_LABELS);
        return;
      }

      const { data: vereinRow } = await supabase
        .from("vereine")
        .select("tab1, tab2, tab3, tab4, tab5")
        .eq("id", vereinId)
        .maybeSingle();

      if (!active) return;

      setLabels({
        tab1: vereinRow?.tab1 || DEFAULT_LABELS.tab1,
        tab2: vereinRow?.tab2 || DEFAULT_LABELS.tab2,
        tab3: vereinRow?.tab3 || DEFAULT_LABELS.tab3,
        tab4: vereinRow?.tab4 || DEFAULT_LABELS.tab4,
        tab5: vereinRow?.tab5 || DEFAULT_LABELS.tab5,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(!!data.session);
      setReady(true);
      if (data.session) void loadRole(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(!!newSession);
      if (newSession) {
        void loadRole(newSession.user.id);
      } else {
        setIsAdminOrSu(false);
        setLabels(DEFAULT_LABELS);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready || !session) {
    return null;
  }

  const tabs: Tab[] = [
    {
      key: "activities",
      label: labels.tab1,
      href: "/activities",
      icon: Calendar,
      isActive: (p) => p.startsWith("/activities"),
    },
    ...(isAdminOrSu
      ? [
          {
            key: "lions",
            label: labels.tab2,
            href: "/mitglieder",
            icon: Users,
            isActive: (p: string) => p === "/mitglieder",
          },
          {
            key: "activity",
            label: labels.tab3,
            href: "/activities?new=1",
            icon: CirclePlus,
            isActive: () => false,
          },
          {
            key: "kategorien",
            label: labels.tab4,
            href: "/kategorien",
            icon: List,
            isActive: (p: string) => p === "/kategorien",
          },
        ]
      : []),
    {
      key: "profil",
      label: labels.tab5,
      href: "/profil",
      icon: CircleUser,
      isActive: (p) => p === "/profil",
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-stretch border-t border-white/10 bg-brand-blue">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 truncate px-1 text-xs font-medium ${
              active ? "text-brand-gold" : "text-white/70 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
