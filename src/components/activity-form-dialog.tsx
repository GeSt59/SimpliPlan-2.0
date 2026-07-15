"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { buildDefaultZeitbereichSlots } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const NAME_MAX_LENGTH = 100;
const ORT_MAX_LENGTH = 100;
const BESCHREIBUNG_MAX_LENGTH = 1000;

const activityFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name ist erforderlich")
      .max(NAME_MAX_LENGTH, `Maximal ${NAME_MAX_LENGTH} Zeichen`),
    categoryId: z.string().min(1, "Kategorie ist erforderlich"),
    startDateTime: z.date().optional(),
    endDateTime: z.date().optional(),
    ort: z
      .string()
      .min(1, "Ort ist erforderlich")
      .max(ORT_MAX_LENGTH, `Maximal ${ORT_MAX_LENGTH} Zeichen`),
    beschreibung: z.string().max(BESCHREIBUNG_MAX_LENGTH, `Maximal ${BESCHREIBUNG_MAX_LENGTH} Zeichen`),
  })
  .refine((data) => !!data.startDateTime, {
    message: "Datum und Uhrzeit von ist erforderlich",
    path: ["startDateTime"],
  })
  .refine((data) => !!data.endDateTime, {
    message: "Datum und Uhrzeit bis ist erforderlich",
    path: ["endDateTime"],
  })
  .refine(
    (data) => !data.startDateTime || !data.endDateTime || data.endDateTime > data.startDateTime,
    {
      message: "Datum und Uhrzeit bis muss nach Datum und Uhrzeit von liegen",
      path: ["endDateTime"],
    }
  );

type ActivityFormValues = z.infer<typeof activityFormSchema>;

export type ActivityRecord = {
  id: number;
  adalo_id?: number | null;
  name: string | null;
  category: (string | number)[] | null;
  du_z: string | null;
  du_zbis: string | null;
  ort: string | null;
  beschreibung: string | null;
  einteilungens?: (string | number)[] | null;
};

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vereinId: number;
  createdByUserId: number | null;
  categories: ActivityCategory[];
  activity: ActivityRecord | null;
  onSaved: (savedId: number) => void | Promise<void>;
};

const emptyValues: ActivityFormValues = {
  name: "",
  categoryId: "",
  startDateTime: undefined,
  endDateTime: undefined,
  ort: "",
  beschreibung: "",
};

/** Kombiniertes Datum+Uhrzeit-Feld ("Datum und Uhrzeit von/bis" wie in der Adalo-Vorlage) */
function DateTimeField({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  function handleDateSelect(date: Date | undefined) {
    if (!date) {
      onChange(undefined);
      return;
    }
    const combined = new Date(date);
    if (value) {
      combined.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      combined.setHours(12, 0, 0, 0);
    }
    onChange(combined);
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = e.target.value;
    if (!time) return;
    const [hours, minutes] = time.split(":").map(Number);
    const combined = new Date(value ?? new Date());
    combined.setHours(hours, minutes, 0, 0);
    onChange(combined);
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("flex-1 justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={handleDateSelect} locale={de} />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        className="w-28"
        value={value ? format(value, "HH:mm") : ""}
        onChange={handleTimeChange}
        disabled={!value}
      />
    </div>
  );
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  vereinId,
  createdByUserId,
  categories,
  activity,
  onSaved,
}: ActivityFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    setFormError(null);

    if (activity) {
      form.reset({
        name: activity.name ?? "",
        categoryId: activity.category?.[0] != null ? String(activity.category[0]) : "",
        startDateTime: activity.du_z ? new Date(activity.du_z) : undefined,
        endDateTime: activity.du_zbis ? new Date(activity.du_zbis) : undefined,
        ort: activity.ort ?? "",
        beschreibung: activity.beschreibung ?? "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [open, activity, form]);

  async function onSubmit(values: ActivityFormValues) {
    setSaving(true);
    setFormError(null);

    const payload = {
      name: values.name.trim(),
      category: [Number(values.categoryId)],
      du_z: (values.startDateTime as Date).toISOString(),
      du_zbis: (values.endDateTime as Date).toISOString(),
      ort: values.ort.trim(),
      beschreibung: values.beschreibung.trim() || null,
    };

    try {
      if (activity) {
        const { error } = await supabase.from("activities").update(payload).eq("id", activity.id);
        if (error) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }

        onOpenChange(false);
        await onSaved(activity.id);
      } else {
        const { data: inserted, error } = await supabase
          .from("activities")
          .insert({
            ...payload,
            vereine: [vereinId],
            created_by: createdByUserId ? [createdByUserId] : null,
          })
          .select("id")
          .single();
        if (error) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }

        // Automatische Standard-Zeitbereiche (PROJ-9); schlägt das fehl, bleibt die
        // Activity trotzdem gespeichert - der Admin kann Zeitbereiche manuell nachlegen.
        await supabase.from("einstellungen").insert(
          buildDefaultZeitbereichSlots().map((slot) => ({
            zeitbereich: slot.label,
            von: slot.von,
            bis: slot.bis,
            ben: 0,
            activity: [inserted.id],
          }))
        );

        onOpenChange(false);
        await onSaved(inserted.id);
      }
    } catch {
      setFormError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setSaving(false);
    }
  }

  const hasCategories = categories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? "Activity bearbeiten" : "Activity anlegen"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!hasCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={hasCategories ? "Kategorie wählen..." : "Keine Kategorie vorhanden"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name ?? `Kategorie #${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!hasCategories && (
                    <p className="text-sm text-muted-foreground">
                      Lege zuerst unter „Kategorien&quot; eine Kategorie an.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veranstaltungsname</FormLabel>
                  <FormControl>
                    <Input placeholder="Veranstaltungsname..." maxLength={NAME_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum und Uhrzeit von</FormLabel>
                  <FormControl>
                    <DateTimeField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum und Uhrzeit bis</FormLabel>
                  <FormControl>
                    <DateTimeField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ort</FormLabel>
                  <FormControl>
                    <Input placeholder="Ort..." maxLength={ORT_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beschreibung"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beschreibung..." maxLength={BESCHREIBUNG_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={saving || !hasCategories}
                className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
              >
                {saving ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
