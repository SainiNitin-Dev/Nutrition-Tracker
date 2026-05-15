import { z } from "zod";

export const supplementSchema = z.object({
  name: z.string().trim().min(2).max(80),
  dosageAmount: z.coerce.number().positive().max(100000),
  dosageUnit: z.string().trim().min(1).max(24),
  purpose: z.string().trim().max(120).optional().default(""),
  instructions: z.string().trim().max(180).optional().default(""),
  timeOfDay: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/),
});

export const supplementIdSchema = z.object({
  supplementId: z.string().min(1),
});

export const supplementScheduleSchema = supplementIdSchema.extend({
  timeOfDay: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/),
});

export type SupplementInput = z.infer<typeof supplementSchema>;
