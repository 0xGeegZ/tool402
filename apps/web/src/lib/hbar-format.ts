const tinybarsPerHbar = 100_000_000n;

export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(?:\d{3})+(?!\d))/gu, ",");
}

function trimFraction(digits: string): string {
  return digits.replace(/0+$/u, "");
}

export function formatHbar(tinybars: bigint): string {
  const whole = groupThousands((tinybars / tinybarsPerHbar).toString());
  const fraction = trimFraction(`00000000${tinybars % tinybarsPerHbar}`.slice(-8));
  return `${fraction.length === 0 ? whole : `${whole}.${fraction}`} HBAR`;
}

export function formatShare(basisPoints: bigint): string {
  const whole = (basisPoints / 100n).toString();
  const fraction = trimFraction(`00${basisPoints % 100n}`.slice(-2));
  return fraction.length === 0 ? whole : `${whole}.${fraction}`;
}
