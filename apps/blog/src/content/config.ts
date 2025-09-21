import { defineCollection, z } from "astro:content";
import { formatDisplayDate } from "../features/blog/utils/dates";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string().max(200),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        hero: image().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
      })
      .transform((data) => ({
        ...data,
        computedDates: {
          published: formatDisplayDate(data.pubDate)!,
          updated: formatDisplayDate(data.updatedDate),
        },
      })),
});

export const collections = { blog };
