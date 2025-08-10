import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '../utils/test-utils';
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

const mockUsers = [
    { id: 1, email: 'admin@example.com' },
    { id: 2, email: 'user@example.com' },
];

describe('PriceHistoryPage', () => {
    beforeEach(() => {
        mockedAxios.get.mockClear();
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/users')) {
                return Promise.resolve({ data: mockUsers });
            }
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: mockHistoryData });
            }
            return Promise.reject(new Error('not found'));
        });
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
        render(<PriceHistoryPage />, { mockAuth: { user: { admin: false } }});

        const nameInput = screen.getByLabelText(/product name/i);
        const searchButton = screen.getByRole('button', { name: /search/i });

        await userEvent.type(nameInput, 'Laptop');
        await userEvent.click(searchButton);

        // Check that axios was called with the correct params
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:8000/price-history/search-price-history',
                {
                    params: { product_id: '', name: 'Laptop', notifications: 'all', user_filter: null, admin: false },
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
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/users')) {
                return Promise.resolve({ data: mockUsers });
            }
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: [] });
            }
            return Promise.reject(new Error('not found'));
        });
        render(<PriceHistoryPage />);

        const searchButton = screen.getByRole('button', { name: /search/i });
        await userEvent.click(searchButton);

        expect(await screen.findByText('No results.')).toBeInTheDocument();
    });
});

const mockHistoryDataAdmin: PriceHistoryItem[] = [
    { id: 1, productId: 101, productName: 'Laptop X', price: 1200.50, timestamp: new Date().toISOString(), source: 'Amazon', notifications: true, userEmail: 'admin@example.com' },
    { id: 2, productId: 102, productName: 'Mouse Y', price: 25.00, timestamp: new Date().toISOString(), source: 'Amazon', notifications: false, userEmail: 'user@example.com' },
];

describe('PriceHistoryPage for non-admin users', () => {
    beforeEach(() => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/users')) {
                return Promise.resolve({ data: mockUsers });
            }
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: mockHistoryData });
            }
            return Promise.reject(new Error('not found'));
        });
    });

    it('does not show the user filter', () => {
        render(<PriceHistoryPage />, { mockAuth: { user: { admin: false } } });
        expect(screen.queryByLabelText(/user filter/i)).not.toBeInTheDocument();
    });

    it('does not show the user email column in results', async () => {
        render(<PriceHistoryPage />, { mockAuth: { user: { admin: false } } });

        const searchButton = screen.getByRole('button', { name: /search/i });
        await userEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.queryByText(/user email/i)).not.toBeInTheDocument();
        });
    });
});

describe('PriceHistoryPage for admin users', () => {
    beforeEach(() => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/users')) {
                return Promise.resolve({ data: mockUsers });
            }
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: mockHistoryDataAdmin });
            }
            return Promise.reject(new Error('not found'));
        });
    });

    it('shows the user filter', async () => {
        render(<PriceHistoryPage />, { mockAuth: { user: { admin: true } } });
        expect(await screen.findByLabelText(/user filter/i)).toBeInTheDocument();
    });

    it('shows the user email column in results', async () => {
        render(<PriceHistoryPage />, { mockAuth: { user: { admin: true } } });

        const searchButton = screen.getByRole('button', { name: /search/i });
        await userEvent.click(searchButton);

        await waitFor(() => {
            const resultsContainer = screen.getByTestId('price-history-results');
            expect(within(resultsContainer).getByText(/user email/i)).toBeInTheDocument();
            expect(within(resultsContainer).getByText('admin@example.com')).toBeInTheDocument();
            expect(within(resultsContainer).getByText('user@example.com')).toBeInTheDocument();
        });
    });
});
