import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUserById = vi.fn();
const mockAdminEmailLookup = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    auth: { admin: { updateUserById: (...args: unknown[]) => mockUpdateUserById(...args) } },
    from: (table: string) => {
      if (table !== "users") throw new Error(`unexpected table ${table}`);
      return { select: () => ({ ilike: () => ({ neq: () => ({ maybeSingle: (...args: unknown[]) => mockAdminEmailLookup(...args) }) }) }) };
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

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

const validBody = {
  vorname: "Max",
  nachname: "Mustermann",
  email: "max@example.com",
  mitgliedsnumer: null,
  geburtstag: null,
  vorherTitel: null,
  titelNachher: null,
  aktiv: true,
  admin: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "caller-uuid" } }, error: null });
  mockAdminEmailLookup.mockResolvedValue({ data: null, error: null });
});

describe("PATCH /api/mitglieder/[id]", () => {
  it("returns 400 for a non-numeric id", async () => {
    const res = await PATCH(makeRequest(validBody), makeContext("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when no Authorization header is present", async () => {
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce(null);
    const res = await PATCH(makeRequest(validBody, {}), makeContext("1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when RLS hides the target row (not authorized for this member)", async () => {
    mockSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await PATCH(makeRequest(validBody), makeContext("1"));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("syncs the auth email only when the email actually changed", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "old@example.com" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    const res = await PATCH(makeRequest({ ...validBody, email: "new@example.com" }), makeContext("1"));
    expect(res.status).toBe(200);
    expect(mockUpdateUserById).toHaveBeenCalledWith("auth-uuid-1", { email: "new@example.com", email_confirm: true });
  });

  it("does not touch auth when the email is unchanged", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "max@example.com" },
      error: null,
    });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

    const res = await PATCH(makeRequest(validBody), makeContext("1"));
    expect(res.status).toBe(200);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("returns 400 email_taken via the pre-check when another users row already has this email (updateUserById never called)", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "old@example.com" },
      error: null,
    });
    mockAdminEmailLookup.mockResolvedValue({ data: { id: 99 }, error: null });

    const res = await PATCH(makeRequest({ ...validBody, email: "taken@example.com" }), makeContext("1"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_taken");
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockUpdateSelect).not.toHaveBeenCalled();
  });

  it("falls back to error-message matching for email_taken when updateUserById itself rejects (pre-check safety net)", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "old@example.com" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: { message: "Email already registered" } });

    const res = await PATCH(makeRequest({ ...validBody, email: "taken@example.com" }), makeContext("1"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_taken");
    expect(mockUpdateSelect).not.toHaveBeenCalled();
  });

  it("maps the last-admin trigger error to a 400 last_admin response and rolls back the email sync", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "old@example.com" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockUpdateSelect.mockResolvedValue({
      data: null,
      error: { message: "LETZTER_ADMIN_SCHUTZ: Du bist der einzige aktive Admin dieses Vereins." },
    });

    const res = await PATCH(makeRequest({ ...validBody, email: "new@example.com", admin: false }), makeContext("1"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("last_admin");
    expect(mockUpdateUserById).toHaveBeenLastCalledWith("auth-uuid-1", { email: "old@example.com" });
  });

  it("returns 403 when RLS silently blocks the update (0 rows affected, no error)", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "max@example.com" },
      error: null,
    });
    mockUpdateSelect.mockResolvedValue({ data: [], error: null });

    const res = await PATCH(makeRequest(validBody), makeContext("1"));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
  });
});
