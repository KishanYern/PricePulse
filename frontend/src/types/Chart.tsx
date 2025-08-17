export interface ChartDataPoint {
  timestamp: string;
  price: number;
}

export interface TimeSeriesChartProps {
  data: ChartDataPoint[];
}

export type TimeUnit = 'day' | 'month' | 'year';