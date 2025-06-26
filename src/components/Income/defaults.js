export function defaultIncomeSources(start) {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Salary',
      type: 'Employment',
      amount: 10000,
      frequency: 12,
      growth: 5,
      taxRate: 30,
      startYear: start,
      endYear: null,
      linkedAssetId: '',
      active: true,
    },
  ]
}
