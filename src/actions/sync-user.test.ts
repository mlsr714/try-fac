import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Clerk server functions
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock the database
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  users: { id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

import { syncUser } from "./sync-user";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";

describe("syncUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await syncUser();
    expect(result).toBeNull();
  });

  it("returns null when currentUser returns null", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(currentUser).mockResolvedValue(null);

    const result = await syncUser();
    expect(result).toBeNull();
  });

  it("creates a new user when they don't exist in the database", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(currentUser).mockResolvedValue({
      emailAddresses: [{ emailAddress: "test@example.com" }],
      firstName: "John",
      lastName: "Doe",
      imageUrl: "https://example.com/avatar.png",
    } as ReturnType<typeof currentUser> extends Promise<infer T> ? T : never);

    // Chain mocks for select query: db.select().from().where().limit()
    const limitMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.mocked(db.select).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof db.select>);

    // Chain mocks for insert: db.insert().values()
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue({ values: valuesMock } as unknown as ReturnType<typeof db.insert>);

    const result = await syncUser();

    expect(result).toEqual({
      id: "user_123",
      email: "test@example.com",
      name: "John Doe",
      imageUrl: "https://example.com/avatar.png",
    });
    expect(valuesMock).toHaveBeenCalledWith({
      id: "user_123",
      email: "test@example.com",
      name: "John Doe",
      imageUrl: "https://example.com/avatar.png",
    });
  });

  it("updates an existing user when they already exist in the database", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(currentUser).mockResolvedValue({
      emailAddresses: [{ emailAddress: "updated@example.com" }],
      firstName: "Jane",
      lastName: "Doe",
      imageUrl: "https://example.com/new-avatar.png",
    } as ReturnType<typeof currentUser> extends Promise<infer T> ? T : never);

    // Chain mocks for select query - user exists
    const limitMock = vi.fn().mockResolvedValue([{ id: "user_123" }]);
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.mocked(db.select).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof db.select>);

    // Chain mocks for update: db.update().set().where()
    const updateWhereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as unknown as ReturnType<typeof db.update>);

    const result = await syncUser();

    expect(result).toEqual({
      id: "user_123",
      email: "updated@example.com",
      name: "Jane Doe",
      imageUrl: "https://example.com/new-avatar.png",
    });
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "updated@example.com",
        name: "Jane Doe",
        imageUrl: "https://example.com/new-avatar.png",
      })
    );
  });

  it("handles user with no name gracefully", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_456" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(currentUser).mockResolvedValue({
      emailAddresses: [{ emailAddress: "noname@example.com" }],
      firstName: null,
      lastName: null,
      imageUrl: null,
    } as unknown as ReturnType<typeof currentUser> extends Promise<infer T> ? T : never);

    const limitMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.mocked(db.select).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof db.select>);

    const valuesMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue({ values: valuesMock } as unknown as ReturnType<typeof db.insert>);

    const result = await syncUser();

    expect(result).toEqual({
      id: "user_456",
      email: "noname@example.com",
      name: null,
      imageUrl: null,
    });
    expect(valuesMock).toHaveBeenCalledWith({
      id: "user_456",
      email: "noname@example.com",
      name: null,
      imageUrl: null,
    });
  });
});
