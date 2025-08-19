import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import TimeSeriesChart from './TimeSeriesChart';
import type { ChartDataPoint } from '../types/Chart';

// Mock the Line component from react-chartjs-2
vi.mock('react-chartjs-2', () => ({
    Line: ({ data, options }: { data: any, options: any }) => (
        <div data-testid="mock-chart">
            <pre>{JSON.stringify({data, options}, null, 2)}</pre>
        </div>
    ),
}));

const mockData: ChartDataPoint[] = [
    { timestamp: '2023-01-01T12:00:00Z', price: 100 },
    { timestamp: '2023-01-01T18:00:00Z', price: 110 },
    { timestamp: '2023-01-02T12:00:00Z', price: 105 },
    { timestamp: '2023-02-15T12:00:00Z', price: 120 },
    { timestamp: '2023-02-16T12:00:00Z', price: 125 },
    { timestamp: '2024-03-10T12:00:00Z', price: 150 },
];

describe('TimeSeriesChart', () => {
    it('should render the chart with initial data aggregated by day', () => {
        render(<TimeSeriesChart data={mockData} />);

        expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
        const chartData = JSON.parse(screen.getByText(/{.*}/).textContent || '{}');

        // Check if data is aggregated by day
        expect(chartData.data.labels).toEqual(['2023-01-01', '2023-01-02', '2023-02-15', '2023-02-16', '2024-03-10']);
        expect(chartData.data.datasets[0].data).toEqual([105, 105, 120, 125, 150]); // Averages
    });

    it('should re-aggregate data when the time unit is changed to month', async () => {
        render(<TimeSeriesChart data={mockData} />);

        const monthButton = screen.getByRole('button', { name: /month/i });
        await userEvent.click(monthButton);

        const chartData = JSON.parse(screen.getByText(/{.*}/).textContent || '{}');
        expect(chartData.data.labels).toEqual(['2023-01', '2023-02', '2024-03']);
        expect(chartData.data.datasets[0].data).toEqual([105, 122.5, 150]); // Averages
    });

    it('should re-aggregate data when the time unit is changed to year', async () => {
        render(<TimeSeriesChart data={mockData} />);

        const yearButton = screen.getByRole('button', { name: /year/i });
        await userEvent.click(yearButton);

        const chartData = JSON.parse(screen.getByText(/{.*}/).textContent || '{}');
        expect(chartData.data.labels).toEqual(['2023', '2024']);
        expect(chartData.data.datasets[0].data).toEqual([112, 150]); // Averages
    });

    it('should have the correct options for the chart', () => {
        render(<TimeSeriesChart data={mockData} />);
        const chartData = JSON.parse(screen.getByText(/{.*}/).textContent || '{}');

        expect(chartData.options.plugins.title.text).toBe('Price History');
        expect(chartData.options.scales.x.time.unit).toBe('day');
    });
});
