import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUserById = vi.fn();
const mockAdminEmailLookup = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
      },
    },
    from: (table: string) => {
      if (table === "users") {
        return {
          select: () => ({ ilike: () => ({ neq: () => ({ maybeSingle: (...args: unknown[]) => mockAdminEmailLookup(...args) }) }) }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  },
}));

const mockGetUser = vi.fn();
const mockSelectMaybeSingle = vi.fn();
const mockUpdateSelect = vi.fn();

vi.mock("@/lib/supabase-scoped", () => ({
  scopedClientFromRequest: vi.fn(() => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (table: string) => {
      if (table !== "users") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({ eq: () => ({ maybeSingle: (...args: unknown[]) => mockSelectMaybeSingle(...args) }) }),
        update: () => ({ eq: () => ({ select: (...args: unknown[]) => mockUpdateSelect(...args) }) }),
      };
    },
  })),
}));

const { scopedClientFromRequest } = await import("@/lib/supabase-scoped");
const { PATCH } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = { authorization: "Bearer token123" }) {
  return {
    json: async () => body,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Parameters<typeof PATCH>[0];
}

const validBody = {
  vorname: "Max",
  nachname: "Mustermann",
  email: "max@example.com",
  mitgliedsnumer: null,
  geburtstag: null,
  vorherTitel: null,
  titelNachher: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "caller-uuid" } }, error: null });
  mockAdminEmailLookup.mockResolvedValue({ data: null, error: null });
});

describe("PATCH /api/profil", () => {
  it("returns 401 when no Authorization header is present", async () => {
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce(null);
    const res = await PATCH(makeRequest(validBody, {}));
    expect(res.status).toBe(401);
  });

  it("returns 400 validation when a required field is missing", async () => {
    const res = await PATCH(makeRequest({ ...validBody, vorname: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("validation");
  });

  it("returns 403 when the caller has no own users row (RLS hides it)", async () => {
    mockSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await PATCH(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("targets the caller's own row via auth_user_id, not an id param", async () => {
    let capturedEq: [string, unknown] | null = null;
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "users") throw new Error(`unexpected table ${table}`);
        return {
          select: () => ({
            eq: (col: string, val: unknown) => {
              capturedEq = [col, val];
              return { maybeSingle: mockSelectMaybeSingle };
            },
          }),
          update: () => ({ eq: () => ({ select: mockUpdateSelect }) }),
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "max@example.com" },
      error: null,
    });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    await PATCH(makeRequest(validBody));
    expect(capturedEq).toEqual(["auth_user_id", "caller-uuid"]);
  });

  it("syncs the auth email only when the email actually changed", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "old@example.com" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    const res = await PATCH(makeRequest({ ...validBody, email: "new@example.com" }));
    expect(res.status).toBe(200);
    expect(mockUpdateUserById).toHaveBeenCalledWith("caller-uuid", { email: "new@example.com", email_confirm: true });
  });

  it("does not touch auth when the email is unchanged", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "max@example.com" },
      error: null,
    });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    const res = await PATCH(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("returns 400 email_taken via the pre-check when another users row already has this email", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "old@example.com" },
      error: null,
    });
    mockAdminEmailLookup.mockResolvedValue({ data: { id: 99 }, error: null });

    const res = await PATCH(makeRequest({ ...validBody, email: "taken@example.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_taken");
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockUpdateSelect).not.toHaveBeenCalled();
  });

  it("maps a blocked update (e.g. RLS/trigger rejection) to a 403 forbidden response and rolls back the email sync", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "old@example.com" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockUpdateSelect.mockResolvedValue({ data: [], error: null });

    const res = await PATCH(makeRequest({ ...validBody, email: "new@example.com" }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
    expect(mockUpdateUserById).toHaveBeenLastCalledWith("caller-uuid", { email: "old@example.com" });
  });

  it("writes profilePictureUrl when present in the body", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "max@example.com" },
      error: null,
    });
    let capturedUpdate: Record<string, unknown> | null = null;
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "users") throw new Error(`unexpected table ${table}`);
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockSelectMaybeSingle }) }),
          update: (payload: Record<string, unknown>) => {
            capturedUpdate = payload;
            return { eq: () => ({ select: mockUpdateSelect }) };
          },
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    const res = await PATCH(makeRequest({ ...validBody, profilePictureUrl: "https://example.com/pic.jpg" }));
    expect(res.status).toBe(200);
    expect(capturedUpdate).toMatchObject({ profile_picture_url: "https://example.com/pic.jpg" });
  });

  it("never includes admin/aktiv/su in the update payload", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "caller-uuid", email: "max@example.com" },
      error: null,
    });
    let capturedUpdate: Record<string, unknown> | null = null;
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "users") throw new Error(`unexpected table ${table}`);
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockSelectMaybeSingle }) }),
          update: (payload: Record<string, unknown>) => {
            capturedUpdate = payload;
            return { eq: () => ({ select: mockUpdateSelect }) };
          },
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    await PATCH(makeRequest(validBody));
    expect(capturedUpdate).not.toHaveProperty("admin");
    expect(capturedUpdate).not.toHaveProperty("aktiv");
    expect(capturedUpdate).not.toHaveProperty("su");
    expect(capturedUpdate).not.toHaveProperty("verein");
  });
});
