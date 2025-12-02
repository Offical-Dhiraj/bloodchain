import { z } from "zod"

export const requestSchema = z.object({
    bloodType: z.enum([
        "A_POSITIVE",
        "A_NEGATIVE",
        "B_POSITIVE",
        "B_NEGATIVE",
        "O_POSITIVE",
        "O_NEGATIVE",
        "AB_POSITIVE",
        "AB_NEGATIVE",
    ]),

    rhFactor: z.enum(["POSITIVE", "NEGATIVE"]),

    units: z.number().min(1).max(10),

    urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "EMERGENCY"]),

    latitude: z.number(),
    longitude: z.number(),

    radius: z.number().optional().default(50),
})

export type RequestSchemaType = z.infer<typeof requestSchema>
