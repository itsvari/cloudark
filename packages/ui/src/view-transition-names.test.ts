import { describe, expect, it } from "vitest";
import { titleAnchorStyle, viewTransitionName, viewTransitionStyle } from "./view-transition-names";

describe("view transition names", () => {
  it("derives the same name from a link and from the page it opens", () => {
    expect(viewTransitionName("ledger-title", "/gigs/blacklight-rave-xvi-nosferavetu")).toBe("ledger-title-gigs-blacklight-rave-xvi-nosferavetu");
    expect(viewTransitionName("ledger-title", "/gigs/blacklight-rave-xvi-nosferavetu/")).toBe("ledger-title-gigs-blacklight-rave-xvi-nosferavetu");
    expect(viewTransitionName("card-title", "/projects/markwire?from=home#why")).toBe("card-title-projects-markwire");
  });

  it("produces identifiers that stay valid when a slug starts with a digit or carries other characters", () => {
    expect(viewTransitionName("ledger-row", "/gigs/3niti-x-blacklight-000")).toBe("ledger-row-gigs-3niti-x-blacklight-000");
    expect(viewTransitionName("card-title", "/Projects/Cloud_Ark v2")).toBe("card-title-projects-cloud-ark-v2");
  });

  it("names nothing for other sites or the root, which have no counterpart", () => {
    expect(viewTransitionName("ledger-title", "https://v4ri.xyz/gigs/skf2026")).toBeUndefined();
    expect(viewTransitionName("ledger-title", "//v4ri.xyz/gigs/skf2026")).toBeUndefined();
    expect(viewTransitionName("card-title", "/")).toBeUndefined();
  });

  it("formats inline declarations and omits them when there is no name", () => {
    expect(viewTransitionStyle("card-title", "/projects/markwire")).toBe("view-transition-name:card-title-projects-markwire");
    expect(titleAnchorStyle("/gigs/skf2026")).toBe("--title-anchor:ledger-title-gigs-skf2026");
    expect(viewTransitionStyle("card-title", "https://github.com/itsvari")).toBeUndefined();
    expect(titleAnchorStyle("/")).toBeUndefined();
  });
});
