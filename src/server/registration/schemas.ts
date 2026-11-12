import { z } from "zod";

export const availabilityQuerySchema = z.object({ semesterId: z.string().min(1).optional(), level: z.coerce.number().int().min(100).max(500).optional() });
export const registrationSubmissionSchema = z.object({ semesterId: z.string().min(1), courseOfferingIds: z.array(z.string().min(1)).min(1).max(12) });
export const dropRegistrationSchema = z.object({ registrationId: z.string().min(1) });
