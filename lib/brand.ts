/**
 * Single source of truth for everything market-specific.
 *
 * These are the one-line swaps: renaming the product, repointing the
 * post-result call to action, or changing the privacy contact should never
 * require touching a component.
 */
export const BRAND = {
  /** Product name. Shown in the page title, landing hero and result screen. */
  name: "AI Readiness Snapshot",
  /** Short line under the name on the landing page. */
  tagline: "Find out how ready you really are.",
  /** Who operates the assessment — used in the privacy policy. */
  operator: "369",
  /** Where privacy requests go. */
  privacyEmail: "privacy@example.com",
} as const;

/**
 * The offer behind the assessment. Shown at the bottom of the result screen,
 * after the score and the recommended actions.
 *
 * `href` of null renders the copy without a button — the current default,
 * since there is no offer wired up yet.
 */
export const RESULT_CTA = {
  heading: "What now?",
  copy: "Pick one action above and do it this week. A score only matters if it moves.",
  buttonLabel: null as string | null,
  href: null as string | null,
};
