import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Writing — dated, tagged, citable. Drafts are excluded from production. */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/* Selected work — the case entries behind the landing index. */
const works = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    order: z.number().default(0),
    role: z.string().default(''),
    stack: z.array(z.string()).default([]),
    outcome: z.string().default(''),
  }),
});

export const collections = { posts, works };
