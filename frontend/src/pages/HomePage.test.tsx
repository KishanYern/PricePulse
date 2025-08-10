import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Home from './HomePage';
import { Product } from '../types/Product';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock the AddProduct component to isolate HomePage logic
vi.mock('../components/AddProduct', () => ({
    AddProduct: vi.fn(({ onProductAdded }) => (
        <div>
            <h2>Add Product Form</h2>
            <button onClick={() => onProductAdded({ id: 3, name: 'New Mock Product', url: 'http://new.com', lastChecked: new Date().toISOString() })}>
                Add Mock Product
            </button>
        </div>
    )),
}));

const mockUser = { id: 1, email: 'user@example.com', admin: false };

const mockProducts: Product[] = [
    { id: 1, name: 'Test Product 1', url: 'http://a.com', lastChecked: new Date().toISOString(), currentPrice: 100 },
    { id: 2, name: 'Test Product 2', url: 'http://b.com', lastChecked: new Date().toISOString(), currentPrice: 200 },
];

describe('HomePage', () => {
    beforeEach(() => {
        mockedAxios.get.mockClear();
    });

    it('should show a loading state while fetching products', () => {
        // Mock a pending promise
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });
        expect(screen.getByText('Loading products...')).toBeInTheDocument();
    });

    it('should prompt to log in if the user is not authenticated', () => {
        render(<Home />, { mockAuth: { isAuthenticated: false, user: null } });
        expect(screen.getByText('Please log in to view products.')).toBeInTheDocument();
    });

    it('should fetch and display products for an authenticated user', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockProducts });
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        // Wait for products to be loaded and displayed
        expect(await screen.findByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        // Use regex to be resilient to whitespace around the price
        expect(screen.getByText(/Current Price: \$\s*100\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Current Price: \$\s*200\.00/)).toBeInTheDocument();

        // Verify axios was called correctly
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `http://localhost:8000/products/${mockUser.id}/user-products`,
            { withCredentials: true }
        );
    });

    it('should handle the case where there are no products', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
        });

        // Check that no product names are rendered
        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });

    it('should toggle the AddProduct form visibility', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        const addProductButton = await screen.findByRole('button', { name: /add product/i });

        // Form should be hidden initially
        expect(screen.queryByText('Add Product Form')).not.toBeInTheDocument();

        // Click to show
        await userEvent.click(addProductButton);
        expect(await screen.findByText('Add Product Form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /hide add product/i })).toBeInTheDocument();

        // Click to hide
        await userEvent.click(addProductButton);
        expect(screen.queryByText('Add Product Form')).not.toBeInTheDocument();
    });

    it('should add a new product to the list when onProductAdded is called', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockProducts });
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        // Wait for initial products to load
        expect(await screen.findByText('Test Product 1')).toBeInTheDocument();

        // Open the form
        const addProductButton = screen.getByRole('button', { name: /add product/i });
        await userEvent.click(addProductButton);

        // "Submit" the form in our mock component
        const mockSubmit = await screen.findByRole('button', { name: 'Add Mock Product' });
        await userEvent.click(mockSubmit);

        // Check that the new product appears in the list
        expect(await screen.findByText('New Mock Product')).toBeInTheDocument();
      });
});
