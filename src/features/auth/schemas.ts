import { z } from 'zod'

export const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use at most 128 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')
  .refine((value) => value.trim() === value, 'Remove spaces at the start or end')

export const name = z.string().trim().min(1, 'Required').max(100, 'Too long')
export const email = z.string().trim().min(1, 'Required').email('Enter a valid email address')
