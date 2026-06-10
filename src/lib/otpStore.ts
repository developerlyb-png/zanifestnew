interface OtpData {
  otp: string;
  email: string;
  expire: number;
}


export const otpStore: Record<string, OtpData> = {};