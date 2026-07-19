"use client";

import type { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAME_MAX_LENGTH,
  ORT_MAX_LENGTH,
  BESCHREIBUNG_MAX_LENGTH,
  type ActivityFormValues,
} from "@/lib/activity-form-schema";
import type { ActivityCategory } from "@/lib/activities";
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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
            className={cn(
              "flex-1 justify-start border-brand-blue text-left font-normal focus:border-2 focus:border-brand-gold focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              !value && "text-muted-foreground"
            )}
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

type ActivityFormFieldsProps = {
  form: UseFormReturn<ActivityFormValues>;
  categories: ActivityCategory[];
};

/** Die 6 Activity-Felder (Kategorie, Name, Start/Ende, Ort, Beschreibung) - ohne Chrome/Submit, für Dialog und Vollbild-Seite gleichermaßen. */
export function ActivityFormFields({ form, categories }: ActivityFormFieldsProps) {
  const hasCategories = categories.length > 0;

  return (
    <>
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kategorie</FormLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={!hasCategories}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={hasCategories ? "Kategorie wählen..." : "Keine Kategorie vorhanden"} />
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
              <p className="text-sm text-muted-foreground">Lege zuerst unter „Kategorien&quot; eine Kategorie an.</p>
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
    </>
  );
}
