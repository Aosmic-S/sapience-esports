export const REGISTRATION_FEES = {
  'fc-mobile': 300,
  bgmi: 200,
} as const;

export function registrationFee(game: keyof typeof REGISTRATION_FEES, players = 1) {
  return REGISTRATION_FEES[game] * players;
}

export function registrationFeeLabel(game: keyof typeof REGISTRATION_FEES) {
  return `₹${registrationFee(game)} per player`;
}