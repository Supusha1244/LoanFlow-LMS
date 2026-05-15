export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  // Age check: must be between 23 and 50
  const today = new Date();
  const dob = new Date(input.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Salary check: must be >= 25000
  if (input.monthlySalary < 25000) {
    errors.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary}`);
  }

  // PAN format check
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    errors.push('Invalid PAN format. Must be like ABCDE1234F (5 letters, 4 digits, 1 letter).');
  }

  // Employment mode check
  if (input.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan.');
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}
