import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  },
}));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return { json: async () => body } as Parameters<typeof POST>[0];
}

const validBody = {
  vorname: "Max",
  nachname: "Mustermann",
  email: "max@example.com",
  password: "geheim123",
  freischaltcode: "ABC123",
};

function mockVereineLookup(result: { data: { id: number } | null; error: unknown }) {
  return { select: () => ({ ilike: () => ({ maybeSingle: async () => result }) }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/register", () => {
  it("returns 400 for invalid input and never touches the database", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("validation");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_code when the freischaltcode matches no verein", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "vereine") return mockVereineLookup({ data: null, error: null });
      throw new Error(`unexpected table ${table}`);
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_code");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("returns 400 email_taken when the auth account already exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "vereine") return mockVereineLookup({ data: { id: 1 }, error: null });
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: null, error: { message: "User already registered" } });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_taken");
  });

  it("creates the auth user and the users row on success", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "vereine") return mockVereineLookup({ data: { id: 42 }, error: null });
      if (table === "users") return { insert: insertMock };
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "auth-uuid-1" } }, error: null });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vorname: "Max",
        nachname: "Mustermann",
        email: "max@example.com",
        verein: [42],
        auth_user_id: "auth-uuid-1",
        admin: false,
        aktiv: true,
      })
    );
  });

  it("rolls back the auth user if writing the users row fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "vereine") return mockVereineLookup({ data: { id: 42 }, error: null });
      if (table === "users") return { insert: vi.fn().mockResolvedValue({ error: { message: "db error" } }) };
      throw new Error(`unexpected table ${table}`);
    });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "auth-uuid-2" } }, error: null });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith("auth-uuid-2");
  });
});
