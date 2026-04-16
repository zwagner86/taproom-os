import { z } from "zod";

export const nonEmptyString = z.string().trim().min(1);

export const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

export function parseEnv<TSchema extends z.ZodRawShape>(
  schema: z.ZodObject<TSchema>,
  values: Record<string, string | undefined>,
) {
  return schema.parse(values);
}

