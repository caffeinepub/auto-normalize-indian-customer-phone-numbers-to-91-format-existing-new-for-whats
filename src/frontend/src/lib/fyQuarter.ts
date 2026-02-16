export interface FYQuarter {
  quarter: number;
  label: string;
  startMonth: number;
  endMonth: number;
}

export const FY_QUARTERS: FYQuarter[] = [
  { quarter: 1, label: 'Q1 (Apr-Jun)', startMonth: 4, endMonth: 6 },
  { quarter: 2, label: 'Q2 (Jul-Sep)', startMonth: 7, endMonth: 9 },
  { quarter: 3, label: 'Q3 (Oct-Dec)', startMonth: 10, endMonth: 12 },
  { quarter: 4, label: 'Q4 (Jan-Mar)', startMonth: 1, endMonth: 3 },
];

export function getCurrentFYQuarter(): number {
  const month = new Date().getMonth() + 1;
  
  if (month >= 4 && month <= 6) return 1;
  if (month >= 7 && month <= 9) return 2;
  if (month >= 10 && month <= 12) return 3;
  return 4;
}

export function getFYQuarterLabel(quarter: number): string {
  const q = FY_QUARTERS.find(fq => fq.quarter === quarter);
  return q ? q.label : `Q${quarter}`;
}
