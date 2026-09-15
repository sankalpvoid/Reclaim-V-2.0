export type MoneyReclaimedInput = {
  cigarettesAvoided: number;
  cigarettesPerPack: number;
  packPrice: number;
};

export function calculateMoneyReclaimed({
  cigarettesAvoided,
  cigarettesPerPack,
  packPrice,
}: MoneyReclaimedInput): number {
  if (cigarettesAvoided <= 0 || cigarettesPerPack <= 0 || packPrice <= 0) {
    return 0;
  }

  const pricePerCigarette = packPrice / cigarettesPerPack;
  return cigarettesAvoided * pricePerCigarette;
}
