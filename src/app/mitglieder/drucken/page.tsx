"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const PRINT_STORAGE_KEY = "mitglieder-druck-payload";

type DruckMitglied = {
  name: string;
  email: string;
  telefonnummer: string;
};

type DruckPayload = {
  vereinsname: string;
  stand: string;
  mitglieder: DruckMitglied[];
};

export default function MitgliederDruckenPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [payload, setPayload] = useState<DruckPayload | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        window.location.href = "/";
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("admin, su")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (!userRow?.admin && !userRow?.su) {
        window.location.href = "/";
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    void check();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(PRINT_STORAGE_KEY);
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (allowed && payload) {
      window.print();
    }
  }, [allowed, payload]);

  if (checking) return null;
  if (!allowed) return null;

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Keine Druckdaten gefunden. Bitte über die Mitgliederverwaltung erneut drucken.
        </p>
        <Link href="/mitglieder" className="text-sm text-brand-blue underline">
          Zurück zur Mitgliederverwaltung
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link href="/mitglieder" className="mb-4 inline-block text-sm text-brand-blue underline print:hidden">
        Zurück zur Mitgliederverwaltung
      </Link>

      <h1 className="text-2xl font-bold">Mitgliederverzeichnis</h1>
      {payload.vereinsname && <p className="mt-1 text-lg">{payload.vereinsname}</p>}
      <p className="mt-1 text-sm text-muted-foreground">Stand {payload.stand}</p>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-black p-2 text-left">Name</th>
            <th className="border border-black p-2 text-left">E-Mail</th>
            <th className="border border-black p-2 text-left">Telefonnummer</th>
          </tr>
        </thead>
        <tbody>
          {payload.mitglieder.map((m, i) => (
            <tr key={i}>
              <td className="border border-black p-2">{m.name}</td>
              <td className="border border-black p-2">{m.email}</td>
              <td className="border border-black p-2">{m.telefonnummer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
