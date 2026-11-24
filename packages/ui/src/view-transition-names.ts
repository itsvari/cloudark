// names that let a cross-document view transition pair an element with its counterpart on the next page.
// both pages derive the name from the same address, so the pairing needs no script: a card or ledger row names
// its title after the page it links to, and that page names its heading after its own address.

export type ViewTransitionRole = "card-title" | "ledger-title" | "ledger-row";

const unsafeIdentifierCharacters = /[^a-z0-9]+/g;
const leadingOrTrailingHyphens = /^-+|-+$/g;

/** The transition name for an internal address, or undefined for another site or the root, which pair with nothing. */
export function viewTransitionName(role: ViewTransitionRole, href: string): string | undefined {
  if (!href.startsWith("/") || href.startsWith("//")) return undefined;
  const [path = ""] = href.split(/[?#]/);
  const slug = path.toLowerCase().replace(unsafeIdentifierCharacters, "-").replace(leadingOrTrailingHyphens, "");
  return slug ? `${role}-${slug}` : undefined;
}

/** An inline declaration for the element that carries the name itself. */
export function viewTransitionStyle(role: ViewTransitionRole, href: string): string | undefined {
  const name = viewTransitionName(role, href);
  return name ? `view-transition-name:${name}` : undefined;
}

/** An inline declaration for a heading whose anchor, not the heading, receives a travelling ledger title. */
export function titleAnchorStyle(href: string): string | undefined {
  const name = viewTransitionName("ledger-title", href);
  return name ? `--title-anchor:${name}` : undefined;
}
