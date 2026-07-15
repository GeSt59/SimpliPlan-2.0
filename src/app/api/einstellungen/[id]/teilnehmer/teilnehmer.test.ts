import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockMeLookup = vi.fn();
const mockZeitbereichLookup = vi.fn();
const mockTargetLookup = vi.fn();

vi.mock("@/lib/supabase-scoped", () => ({
  scopedClientFromRequest: vi.fn(() => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (table: string) => {
      if (table === "users") {
        return { select: () => ({ eq: () => ({ maybeSingle: (...args: unknown[]) => mockMeLookup(...args) }) }) };
      }
      if (table === "einstellungen") {
        return { select: () => ({ eq: () => ({ maybeSingle: (...args: unknown[]) => mockZeitbereichLookup(...args) }) }) };
      }
      if (table === "mitglieder_namen") {
        return { select: () => ({ eq: () => ({ maybeSingle: (...args: unknown[]) => mockTargetLookup(...args) }) }) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  })),
}));

const mockAdminUpdateEq = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "einstellungen") throw new Error(`unexpected table ${table}`);
      return {
        update: (payload: { eingeteilte_users: (string | number)[] }) => ({
          eq: (...args: unknown[]) => mockAdminUpdateEq(payload, ...args),
        }),
      };
    },
  },
}));

const { scopedClientFromRequest } = await import("@/lib/supabase-scoped");
const { POST } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = { authorization: "Bearer token123" }) {
  return {
    json: async () => body,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Parameters<typeof POST>[0];
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "admin-uuid" } }, error: null });
  mockMeLookup.mockResolvedValue({ data: { id: 1, admin: true }, error: null });
  mockZeitbereichLookup.mockResolvedValue({ data: { id: 5, eingeteilte_users: [] }, error: null });
  mockTargetLookup.mockResolvedValue({ data: { id: 42, adalo_id: null }, error: null });
  mockAdminUpdateEq.mockResolvedValue({ error: null });
});

describe("POST /api/einstellungen/[id]/teilnehmer", () => {
  it("returns 400 for a non-numeric zeitbereich id", async () => {
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when no Authorization header is present", async () => {
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce(null);
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }, {}), makeContext("5"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid action value", async () => {
    const res = await POST(makeRequest({ action: "loeschen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(400);
    expect(mockMeLookup).not.toHaveBeenCalled();
  });

  it("returns 400 when mitgliedId is missing", async () => {
    const res = await POST(makeRequest({ action: "hinzufuegen" }), makeContext("5"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the session is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not an admin", async () => {
    mockMeLookup.mockResolvedValue({ data: { id: 1, admin: false }, error: null });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(403);
    expect(mockZeitbereichLookup).not.toHaveBeenCalled();
    expect(mockAdminUpdateEq).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller has no users row at all", async () => {
    mockMeLookup.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(403);
  });

  it("returns 403 when RLS hides the Zeitbereich (belongs to a different verein)", async () => {
    mockZeitbereichLookup.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(403);
    expect(mockAdminUpdateEq).not.toHaveBeenCalled();
  });

  it("returns 403 when the target member is not visible via mitglieder_namen (different verein, cross-tenant protection)", async () => {
    mockTargetLookup.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(403);
    expect(mockAdminUpdateEq).not.toHaveBeenCalled();
  });

  it("adds the target member's real id to an empty eingeteilte_users list", async () => {
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(200);
    expect(mockAdminUpdateEq).toHaveBeenCalledWith({ eingeteilte_users: [42] }, "id", 5);
    expect((await res.json()).eingeteilteUsers).toEqual([42]);
  });

  it("does not duplicate the target when already present (idempotent hinzufuegen)", async () => {
    mockZeitbereichLookup.mockResolvedValue({ data: { id: 5, eingeteilte_users: [42, 7] }, error: null });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(200);
    expect(mockAdminUpdateEq).toHaveBeenCalledWith({ eingeteilte_users: [42, 7] }, "id", 5);
  });

  it("removes only the target member, leaving other signups untouched", async () => {
    mockZeitbereichLookup.mockResolvedValue({ data: { id: 5, eingeteilte_users: [42, 7] }, error: null });
    const res = await POST(makeRequest({ action: "entfernen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(200);
    expect(mockAdminUpdateEq).toHaveBeenCalledWith({ eingeteilte_users: [7] }, "id", 5);
  });

  it("matches a legacy adalo_id entry when removing (not just the real id)", async () => {
    mockZeitbereichLookup.mockResolvedValue({ data: { id: 5, eingeteilte_users: ["555", 7] }, error: null });
    mockTargetLookup.mockResolvedValue({ data: { id: 42, adalo_id: 555 }, error: null });
    const res = await POST(makeRequest({ action: "entfernen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(200);
    expect(mockAdminUpdateEq).toHaveBeenCalledWith({ eingeteilte_users: [7] }, "id", 5);
  });

  it("removing a member not currently signed up is a no-op, not an error", async () => {
    mockZeitbereichLookup.mockResolvedValue({ data: { id: 5, eingeteilte_users: [7] }, error: null });
    const res = await POST(makeRequest({ action: "entfernen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(200);
    expect(mockAdminUpdateEq).toHaveBeenCalledWith({ eingeteilte_users: [7] }, "id", 5);
  });

  it("returns 500 when the database update fails", async () => {
    mockAdminUpdateEq.mockResolvedValue({ error: { message: "db error" } });
    const res = await POST(makeRequest({ action: "hinzufuegen", mitgliedId: 42 }), makeContext("5"));
    expect(res.status).toBe(500);
  });
});
