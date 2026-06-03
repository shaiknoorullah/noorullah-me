/**
 * Writing — featured posts from blog.noorullah.me (Ghost).
 * Hand-curated. Update when you publish something worth surfacing.
 */
export type Post = {
  title: string;
  href: string;
  pubDate?: string;        // ISO 8601
  blurb?: string;          // one-line teaser
};

export const posts: Post[] = [
  // Placeholder entries — replace with real posts once blog has content
  // {
  //   title: "Title here",
  //   href: "https://blog.noorullah.me/slug",
  //   pubDate: "2026-06-15",
  //   blurb: "One-line teaser.",
  // },
];
