import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  description: z.string().min(1),
  draft: z.boolean().default(false),
});

export type BlogFrontmatter = z.infer<typeof blogSchema>;
