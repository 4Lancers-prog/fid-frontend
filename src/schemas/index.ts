import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const farmerSchema = z.object({
  name: z.string().trim().min(2, "Please enter the farmer's name."),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender.' }),
  aadhaarNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 12, 'Enter a valid 12-digit Aadhaar number.'),
  fid: z.string().trim().min(3, 'Please enter a valid FID number.'),
  mobile: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number.'),
  address: z.string().trim().optional(),
  village: z.string().trim().optional(),
  taluk: z.string().trim().optional(),
  district: z.string().trim().optional(),
  photo: z.string().optional(),
});
export type FarmerForm = z.infer<typeof farmerSchema>;

// ---- Service module schemas (mirror the backend validators) ----
const mobile = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.');
const optional = (max = 200) => z.string().trim().max(max).optional();

export const cropSchema = z.object({
  farmerName: z.string().trim().min(2, "Please enter the farmer's name."),
  mobile,
  village: optional(),
  taluk: optional(),
  district: optional(),
  cropName: z.string().trim().min(2, 'Please enter the crop name.'),
  landArea: optional(),
  surveyNumber: optional(),
  season: z.enum(['kharif', 'rabi', 'summer'], { message: 'Please select a season.' }),
  additionalDetails: optional(500),
});

export const vehicleSchema = z.object({
  ownerName: z.string().trim().min(2, "Please enter the owner's name."),
  mobile,
  vehicleType: z.string().trim().min(2, 'Please enter the vehicle type.'),
  registrationNumber: z.string().trim().min(4, 'Please enter a valid registration number.'),
  insuranceType: z.enum(['third_party', 'comprehensive', 'own_damage', 'renewal'], { message: 'Please select an insurance type.' }),
  policyExpiryDate: z.string().trim().optional().or(z.literal('')),
  vehicleMakeModel: optional(),
  manufacturingYear: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d{4}$/.test(v) && +v >= 1950 && +v <= 2100), 'Enter a valid 4-digit year.'),
});

export const trailerSchema = z.object({
  applicantName: z.string().trim().min(2, "Please enter the applicant's name."),
  mobile,
  trailerRegistrationNumber: optional(),
  trailerType: optional(),
  chassisNumber: optional(),
  certificateType: z.enum(['new_registration', 'rc', 'renewal', 'duplicate', 'other'], { message: 'Please select a certificate type.' }),
  address: optional(300),
  additionalDetails: optional(500),
});

export const loanSchema = z.object({
  applicantName: z.string().trim().min(2, "Please enter the applicant's name."),
  mobile,
  pan: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(v), 'Enter a PAN in the correct format, for example ABCDE1234F.'),
  aadhaar: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, '').length === 12, 'Enter a valid 12-digit Aadhaar number.'),
  loanType: z.enum(['home', 'bike', 'vehicle', 'mortgage', 'other'], { message: 'Please select a loan type.' }),
  loanAmount: z.coerce.number({ message: 'Enter a valid loan amount.' }).positive('Enter an amount greater than zero.'),
});

export const rechargeSchema = z.object({
  amountRupees: z.coerce.number({ message: 'Enter a valid amount.' }).positive('Enter an amount greater than zero.'),
  utr: z.string().trim().min(6, 'Enter a valid UTR / transaction reference (at least 6 characters).'),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Please enter the user's name."),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/\d/, 'Password must contain at least one number.'),
  role: z.enum(['super_admin', 'admin', 'operator', 'loan_executive', 'viewer'], { message: 'Please select a role.' }),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name.'),
    email: z.string().trim().email('Enter a valid email address.'),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/\d/, 'Password must contain at least one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    paymentUtr: z.string().trim().optional(),
    paymentAmountRupees: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
export type RegisterForm = z.infer<typeof registerSchema>;
