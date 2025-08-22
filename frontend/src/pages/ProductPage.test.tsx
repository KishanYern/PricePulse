import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import axios from 'axios';
import ProductPage from './ProductPage';
import { Route, Routes } from 'react-router-dom';

// Mock axios and child components
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

vi.mock('../components/TimeSeriesChart', () => ({
    __esModule: true,
    default: () => <div data-testid="time-series-chart" />,
}));

const mockProduct = {
    id: 1,
    name: 'Test Product',
    url: 'http://example.com',
    currentPrice: 100,
    highestPrice: 120,
    lowestPrice: 90,
    source: 'TestMart',
    lastChecked: new Date().toISOString(),
    notes: 'Test notes here',
    notify: true,
    lowerThreshold: 95,
    upperThreshold: 110,
};

const mockPriceHistory = [
    { id: 1, productId: 1, price: 100, timestamp: new Date().toISOString() },
    { id: 2, productId: 1, price: 110, timestamp: new Date().toISOString() },
];

const renderComponent = (productId: string) => {
    // The component now needs to be rendered inside a <Routes> context
    // because it uses useParams. The initial entry in the router
    // will determine what the params are.
    return render(
        <Routes>
            <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>,
        { initialEntries: [`/product/${productId}`] }
    );
};

describe('ProductPage', () => {
    beforeEach(() => {
        mockedAxios.get.mockReset();
    });


    it('should show an error message if fetching the product fails', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network Error'));
        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByText('An Error Occurred')).toBeInTheDocument();
            expect(screen.getByText(/Failed to load product details/)).toBeInTheDocument();
        });
    });

    it('should show "Product not found" if the product is null', async () => {
        mockedAxios.get.mockResolvedValue({ data: null });
        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByText('Product not found')).toBeInTheDocument();
        });
    });

    it('should display product details correctly when data is fetched successfully', async () => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: mockPriceHistory });
            }
            return Promise.resolve({ data: mockProduct });
        });

        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
            expect(screen.getByText(`$${mockProduct.currentPrice.toFixed(2)}`)).toBeInTheDocument();
            expect(screen.getByText(`$${mockProduct.highestPrice.toFixed(2)}`)).toBeInTheDocument();
            expect(screen.getByText(`$${mockProduct.lowestPrice.toFixed(2)}`)).toBeInTheDocument();
            expect(screen.getByText(mockProduct.notes)).toBeInTheDocument();
            expect(screen.getByText('Enabled')).toBeInTheDocument();
            expect(screen.getByText(`$${mockProduct.lowerThreshold.toFixed(2)}`)).toBeInTheDocument();
            expect(screen.getByText(`$${mockProduct.upperThreshold.toFixed(2)}`)).toBeInTheDocument();
        });
    });

    it('should display the TimeSeriesChart when price history is available', async () => {
        mockedAxios.get.mockImplementation((url) => {
             if (url.includes('/price-history')) {
                return Promise.resolve({ data: mockPriceHistory });
            }
            return Promise.resolve({ data: mockProduct });
        });

        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
        });
    });

    it('should show "No Price History" message when price history is empty', async () => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/price-history')) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: mockProduct });
        });

        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByText('No Price History')).toBeInTheDocument();
        });
    });

     it('should show an error message if fetching price history fails', async () => {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/price-history')) {
                return Promise.reject(new Error('Chart Error'));
            }
            return Promise.resolve({ data: mockProduct });
        });

        renderComponent('1');

        await waitFor(() => {
            expect(screen.getByText(/Failed to load price history/)).toBeInTheDocument();
        });
    });
});
