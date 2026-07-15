import { z } from "zod";

export const NAME_MAX_LENGTH = 100;
export const ORT_MAX_LENGTH = 100;
export const BESCHREIBUNG_MAX_LENGTH = 1000;

export const activityFormSchema = z
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

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export const emptyActivityFormValues: ActivityFormValues = {
  name: "",
  categoryId: "",
  startDateTime: undefined,
  endDateTime: undefined,
  ort: "",
  beschreibung: "",
};

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

export function activityRecordToFormValues(activity: ActivityRecord): ActivityFormValues {
  return {
    name: activity.name ?? "",
    categoryId: activity.category?.[0] != null ? String(activity.category[0]) : "",
    startDateTime: activity.du_z ? new Date(activity.du_z) : undefined,
    endDateTime: activity.du_zbis ? new Date(activity.du_zbis) : undefined,
    ort: activity.ort ?? "",
    beschreibung: activity.beschreibung ?? "",
  };
}

export function activityFormValuesToPayload(values: ActivityFormValues) {
  return {
    name: values.name.trim(),
    category: [Number(values.categoryId)],
    du_z: (values.startDateTime as Date).toISOString(),
    du_zbis: (values.endDateTime as Date).toISOString(),
    ort: values.ort.trim(),
    beschreibung: values.beschreibung.trim() || null,
  };
}
