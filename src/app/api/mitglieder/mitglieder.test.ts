import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockAdminFrom(...args),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  },
}));

const mockGetUser = vi.fn();
const mockScopedFrom = vi.fn();

vi.mock("@/lib/supabase-scoped", () => ({
  scopedClientFromRequest: vi.fn(() => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockScopedFrom(...args),
  })),
}));

const { scopedClientFromRequest } = await import("@/lib/supabase-scoped");
const { POST } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = { authorization: "Bearer token123" }) {
  return {
    json: async () => body,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  } as unknown as Parameters<typeof POST>[0];
}

const validBody = {
  vorname: "Max",
  nachname: "Mustermann",
  email: "max@example.com",
  password: "geheim123",
  vereinId: 1,
};

function mockCallerLookup(result: { data: unknown; error: unknown }) {
  return { select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "caller-uuid" } }, error: null });
});

describe("POST /api/mitglieder", () => {
  it("returns 401 when no Authorization header is present", async () => {
    vi.mocked(scopedClientFromRequest).mockReturnValueOnce(null);
    const res = await POST(makeRequest(validBody, {}));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("unauthorized");
  });

  it("returns 400 for invalid input and never touches the database", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("validation");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is neither admin of the target verein nor su", async () => {
    mockScopedFrom.mockImplementation((table: string) => {
      if (table === "users") return mockCallerLookup({ data: { admin: false, su: null, verein: [2] }, error: null });
      throw new Error(`unexpected table ${table}`);
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("allows su to create a member in any verein", async () => {
    mockScopedFrom.mockImplementation((table: string) => {
      if (table === "users") return mockCallerLookup({ data: { admin: false, su: "yes", verein: [] }, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "users") return { insert: insertMock };
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "auth-uuid-1" } }, error: null });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ verein: [1], admin: false, aktiv: true, auth_user_id: "auth-uuid-1" })
    );
  });

  it("returns 400 email_taken when the auth account already exists", async () => {
    mockScopedFrom.mockImplementation((table: string) => {
      if (table === "users") return mockCallerLookup({ data: { admin: true, su: null, verein: [1] }, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: null, error: { message: "User already registered" } });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_taken");
  });

  it("rolls back the auth user if writing the users row fails", async () => {
    mockScopedFrom.mockImplementation((table: string) => {
      if (table === "users") return mockCallerLookup({ data: { admin: true, su: null, verein: [1] }, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "users") return { insert: vi.fn().mockResolvedValue({ error: { message: "db error" } }) };
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "auth-uuid-2" } }, error: null });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith("auth-uuid-2");
  });
});
