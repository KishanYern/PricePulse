import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import PriceHistoryPage from './PriceHistoryPage';
import type { PriceHistoryItem } from '../types/PriceHistory';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const mockHistoryData: PriceHistoryItem[] = [
    { id: 1, productId: 101, productName: 'Laptop X', price: 1200.50, timestamp: new Date().toISOString(), source: 'Amazon', notifications: true },
    { id: 2, productId: 102, productName: 'Mouse Y', price: 25.00, timestamp: new Date().toISOString(), source: 'Amazon', notifications: false },
];

describe('PriceHistoryPage', () => {
    beforeEach(() => {
        mockedAxios.get.mockClear();
    });

    it('renders the search form and buttons', () => {
        render(<PriceHistoryPage />);
        expect(screen.getByRole('heading', { name: /price history search/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/product id/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('performs a search and displays results', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockHistoryData });
        render(<PriceHistoryPage />);

        const nameInput = screen.getByLabelText(/product name/i);
        const searchButton = screen.getByRole('button', { name: /search/i });

        await userEvent.type(nameInput, 'Laptop');
        await userEvent.click(searchButton);

        // Check that axios was called with the correct params
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:8000/price-history/search-price-history',
                {
                    params: { product_id: '', name: 'Laptop', notifications: 'all' },
                    withCredentials: true,
                }
            );
        });

        // Check that results are displayed
        expect(await screen.findByText('Laptop X')).toBeInTheDocument();
        expect(screen.getByText('Mouse Y')).toBeInTheDocument();
        expect(screen.getByText('$1200.50')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
    });

    it('clears the form and results when clear button is clicked', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockHistoryData });
        render(<PriceHistoryPage />);

        const nameInput = screen.getByLabelText(/product name/i);
        const searchButton = screen.getByRole('button', { name: /search/i });
        const clearButton = screen.getByRole('button', { name: /clear/i });

        // Perform a search to populate results
        await userEvent.type(nameInput, 'Laptop');
        await userEvent.click(searchButton);
        expect(await screen.findByText('Laptop X')).toBeInTheDocument();
        expect(nameInput).toHaveValue('Laptop');

        // Click clear
        await userEvent.click(clearButton);

        // Assert form is cleared and results are gone
        expect(nameInput).toHaveValue('');
        expect(screen.queryByText('Laptop X')).not.toBeInTheDocument();
    });

    it('shows "No results." when search returns an empty array', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        render(<PriceHistoryPage />);

        const searchButton = screen.getByRole('button', { name: /search/i });
        await userEvent.click(searchButton);

        expect(await screen.findByText('No results.')).toBeInTheDocument();
    });
});
