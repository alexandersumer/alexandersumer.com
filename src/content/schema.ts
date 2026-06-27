import { z } from 'zod';

export const blogSchema = z
  .object({
    title: z.string().min(1),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    description: z.string().min(1),
    draft: z.boolean().default(false),
  })
  .superRefine(({ date, updated }, ctx) => {
    if (updated && updated < date) {
      ctx.addIssue({
        code: 'custom',
        path: ['updated'],
        message: 'updated must be on or after date',
      });
    }
  });

export type BlogFrontmatter = z.infer<typeof blogSchema>;
