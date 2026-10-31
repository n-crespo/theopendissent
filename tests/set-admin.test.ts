import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const { setAdminClaim } = createRequire(import.meta.url)(
  "../scripts/set-admin.cjs",
);

const fakeAuth = (customClaims?: Record<string, unknown>) => ({
  getUserByEmail: vi.fn(async () => ({ uid: "uid_1", customClaims })),
  setCustomUserClaims: vi.fn(async () => {}),
  revokeRefreshTokens: vi.fn(async () => {}),
});

describe("setAdminClaim", () => {
  it("grants the claim and keeps refresh tokens valid", async () => {
    const auth = fakeAuth();

    await expect(setAdminClaim(auth, "someone@ucla.edu")).resolves.toBe(
      "uid_1",
    );

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("uid_1", {
      admin: true,
    });
    expect(auth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("keeps other claims when granting", async () => {
    const auth = fakeAuth({ beta: true });

    await setAdminClaim(auth, "someone@ucla.edu");

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("uid_1", {
      beta: true,
      admin: true,
    });
  });

  it("removes only the admin claim and revokes sessions when revoking", async () => {
    const auth = fakeAuth({ admin: true, beta: true });

    await setAdminClaim(auth, "someone@ucla.edu", { revoke: true });

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("uid_1", {
      beta: true,
    });
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith("uid_1");
  });

  it("normalizes the email before looking up the account", async () => {
    const auth = fakeAuth();

    await setAdminClaim(auth, "  Someone@UCLA.edu ");

    expect(auth.getUserByEmail).toHaveBeenCalledWith("someone@ucla.edu");
  });

  it("changes nothing when the account does not exist", async () => {
    const auth = fakeAuth();
    auth.getUserByEmail.mockRejectedValue(
      Object.assign(new Error("not found"), { code: "auth/user-not-found" }),
    );

    await expect(setAdminClaim(auth, "nobody@ucla.edu")).rejects.toThrow();

    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });
});
