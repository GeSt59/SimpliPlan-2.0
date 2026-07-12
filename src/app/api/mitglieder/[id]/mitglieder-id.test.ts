import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUserById = vi.fn();
const mockDeleteUser = vi.fn();
const mockAdminEmailLookup = vi.fn();
const mockUsageCheck = vi.fn();
const mockUsersDelete = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
    from: (table: string) => {
      if (table === "users") {
        return {
          select: () => ({ ilike: () => ({ neq: () => ({ maybeSingle: (...args: unknown[]) => mockAdminEmailLookup(...args) }) }) }),
          delete: () => ({ eq: (...args: unknown[]) => mockUsersDelete(...args) }),
        };
      }
      if (table === "einstellungen") {
        return { select: () => ({ or: (...args: unknown[]) => mockUsageCheck(...args) }) };
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
const { PATCH, DELETE } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = { authorization: "Bearer token123" }) {
  return {
    json: async () => body,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Parameters<typeof PATCH>[0];
}

function makeDeleteRequest(headers: Record<string, string> = { authorization: "Bearer token123" }) {
  return {
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Parameters<typeof DELETE>[0];
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
  mockUsageCheck.mockResolvedValue({ count: 0, error: null });
  mockUsersDelete.mockResolvedValue({ error: null });
  mockDeleteUser.mockResolvedValue({ error: null });
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

  it("writes profilePictureUrl when present in the body", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, auth_user_id: "auth-uuid-1", email: "max@example.com" },
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

    const res = await PATCH(makeRequest({ ...validBody, profilePictureUrl: "https://example.com/pic.jpg" }), makeContext("1"));
    expect(res.status).toBe(200);
    expect(capturedUpdate).toMatchObject({ profile_picture_url: "https://example.com/pic.jpg" });
  });
});

describe("DELETE /api/mitglieder/[id]", () => {
  it("returns 400 for a non-numeric id", async () => {
    const res = await DELETE(makeDeleteRequest(), makeContext("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when no Authorization header is present", async () => {
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce(null);
    const res = await DELETE(makeDeleteRequest({}), makeContext("1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when RLS hides the target row", async () => {
    mockSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
    expect(mockUsersDelete).not.toHaveBeenCalled();
  });

  it("returns 400 self_delete when the target is the caller's own row", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, adalo_id: null, auth_user_id: "caller-uuid" },
      error: null,
    });
    const res = await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("self_delete");
    expect(mockUsersDelete).not.toHaveBeenCalled();
  });

  it("returns 409 in_use when the member is referenced in einstellungen.eingeteilte_users", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, adalo_id: 555, auth_user_id: "other-uuid" },
      error: null,
    });
    mockUsageCheck.mockResolvedValue({ count: 1, error: null });

    const res = await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("in_use");
    expect(mockUsersDelete).not.toHaveBeenCalled();
  });

  it("checks both id and adalo_id in the usage filter", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, adalo_id: 555, auth_user_id: "other-uuid" },
      error: null,
    });
    mockUsageCheck.mockResolvedValue({ count: 0, error: null });

    await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(mockUsageCheck).toHaveBeenCalledWith("eingeteilte_users.cs.{1},eingeteilte_users.cs.{555}");
  });

  it("deletes the users row and the auth account on success", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, adalo_id: null, auth_user_id: "other-uuid" },
      error: null,
    });

    const res = await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(res.status).toBe(200);
    expect(mockUsersDelete).toHaveBeenCalledWith("id", 1);
    expect(mockDeleteUser).toHaveBeenCalledWith("other-uuid");
  });

  it("returns 500 and skips the auth deletion when the row delete fails", async () => {
    mockSelectMaybeSingle.mockResolvedValue({
      data: { id: 1, adalo_id: null, auth_user_id: "other-uuid" },
      error: null,
    });
    mockUsersDelete.mockResolvedValue({ error: { message: "db error" } });

    const res = await DELETE(makeDeleteRequest(), makeContext("1"));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
