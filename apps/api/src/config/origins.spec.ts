import {
  getAllowedOrigins,
  getBetterAuthBaseUrl,
  isAllowedOrigin
} from "./origins";

describe("origin configuration", () => {
  it("uses local frontend and API defaults", () => {
    expect(getAllowedOrigins({})).toEqual(["http://localhost:3000"]);
    expect(getBetterAuthBaseUrl({})).toBe("http://localhost:4000");
  });

  it("supports comma-separated CORS origins", () => {
    expect(
      getAllowedOrigins({
        CORS_ORIGINS:
          "https://submission.example.com, https://preview.example.com/"
      })
    ).toEqual([
      "https://submission.example.com",
      "https://preview.example.com"
    ]);
  });

  it("keeps the API auth URL separate from trusted frontend origins", () => {
    const env = {
      BETTER_AUTH_URL: "https://submission-api.example.com",
      FRONTEND_ORIGIN: "https://submission.example.com"
    };

    expect(getBetterAuthBaseUrl(env)).toBe(
      "https://submission-api.example.com"
    );
    expect(getAllowedOrigins(env)).toEqual(["https://submission.example.com"]);
  });

  it("matches exact and wildcard allowed origins", () => {
    const allowedOrigins = [
      "https://submission.example.com",
      "https://*.vercel.app"
    ];

    expect(
      isAllowedOrigin("https://submission.example.com", allowedOrigins)
    ).toBe(true);
    expect(
      isAllowedOrigin("https://submission-git-main.vercel.app", allowedOrigins)
    ).toBe(true);
    expect(isAllowedOrigin("https://not-example.com", allowedOrigins)).toBe(
      false
    );
  });
});
