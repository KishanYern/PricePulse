import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Home from './HomePage';
import type { Product } from '../types/Product';
import type { User } from '../types/User';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock child components
vi.mock('../components/ProductCard', () => ({
    __esModule: true,
    default: ({ product }: { product: Product }) => (
        <div data-testid={`product-card-${product.id}`}>
            <h3>{product.name}</h3>
            <p>${product.currentPrice?.toFixed(2)}</p>
        </div>
    ),
}));


// Mock data
const mockUser: User = { id: 1, email: 'user@example.com', admin: false };
const mockAdmin: User = { id: 2, email: 'admin@example.com', admin: true };
const mockProducts: Product[] = [
    { id: 1, name: 'Test Product 1', url: 'http://a.com', currentPrice: 100, lowestPrice: null, highestPrice: null, notes: null, lowerThreshold: null, upperThreshold: null, notify: true, source: 'Amazon', imageUrl: null, createdAt: new Date().toISOString(), lastChecked: new Date().toISOString() },
    { id: 2, name: 'Test Product 2', url: 'http://b.com', currentPrice: 200, lowestPrice: null, highestPrice: null, notes: null, lowerThreshold: null, upperThreshold: null, notify: true, source: 'eBay', imageUrl: null, createdAt: new Date().toISOString(), lastChecked: new Date().toISOString() },
];
const mockUsers: User[] = [mockUser, mockAdmin];


describe('HomePage', () => {
    beforeEach(() => {
        mockedAxios.get.mockReset();
        mockedAxios.post.mockReset();
        // Default mock for products
        mockedAxios.get.mockResolvedValue({ data: mockProducts });
    });

    it('should show a loading state initially', () => {
        // Since isLoading is controlled by two separate states, we'll mock the API to be pending
        // and set the auth loading state to true to ensure the spinner appears.
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser, isLoading: true } });
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should prompt to log in if the user is not authenticated', async () => {
        render(<Home />, { mockAuth: { isAuthenticated: false, user: null, isLoading: false } });
        expect(await screen.findByText('Please log in to view and track your products.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    it('should fetch and display products for an authenticated user', async () => {
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        await waitFor(() => {
            expect(screen.getByText('Test Product 1')).toBeInTheDocument();
            expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        });

        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `http://localhost:8000/products/${mockUser.id}/user-products`,
            { withCredentials: true }
        );
    });

    it('should display an empty state message when there are no products', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        await waitFor(() => {
            expect(screen.getByText('Your list is empty!')).toBeInTheDocument();
        });
        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
    });

    it('should open the Add Product modal when the button is clicked', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] }); // Start with no products
        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        const addProductButton = await screen.findByRole('button', { name: /add new product/i });

        // Use a more specific selector for the modal if getByRole fails.
        const modal = document.getElementById('add_product_modal');
        expect(modal).not.toHaveClass('modal-open');

        // Click to show modal
        await userEvent.click(addProductButton);
        expect(modal).toHaveClass('modal-open');
        expect(screen.getByText('Add New Product')).toBeInTheDocument();

        // Click close button to hide
        const closeButton = screen.getByTestId('close-modal-button');
        await userEvent.click(closeButton);

        await waitFor(() => {
            expect(modal).not.toHaveClass('modal-open');
        });
    });

    it('should add a new product to the list when the form is submitted', async () => {
        const newProduct = { id: 3, name: 'New Awesome Product', url: 'http://new.com', lastChecked: new Date().toISOString(), currentPrice: 150 };
        mockedAxios.get.mockResolvedValue({ data: mockProducts });
        mockedAxios.post.mockResolvedValue({ status: 201, data: newProduct });

        render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        await screen.findByText('Test Product 1');

        // Open the modal
        const addProductButton = screen.getByRole('button', { name: /add new product/i });
        await userEvent.click(addProductButton);

        // Fill out and submit the form
        const urlInput = screen.getByPlaceholderText('Enter product URL');
        await userEvent.type(urlInput, newProduct.url);

        const submitButton = await screen.findByTestId('add-product-submit-button');
        await userEvent.click(submitButton);

        // The modal should close and the new product should be in the document
        await waitFor(() => {
            expect(screen.getByText(newProduct.name)).toBeInTheDocument();
        });

        const modal = document.getElementById('add_product_modal');
        expect(modal).not.toHaveClass('modal-open');
    });

    describe('Admin View', () => {
        it('should show the user filter dropdown for admin users', async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes('/users')) {
                    return Promise.resolve({ data: mockUsers });
                }
                return Promise.resolve({ data: mockProducts });
            });

            render(<Home />, { mockAuth: { isAuthenticated: true, user: mockAdmin } });

            await waitFor(() => {
                const dropdown = screen.getByRole('combobox');
                expect(dropdown).toBeInTheDocument();
                expect(screen.getByRole('option', { name: 'All Products' })).toBeInTheDocument();
                expect(screen.getByRole('option', { name: mockUser.email })).toBeInTheDocument();
            });
        });

        it('should not show the user filter dropdown for non-admin users', async () => {
            render(<Home />, { mockAuth: { isAuthenticated: true, user: mockUser } });

            await waitFor(() => {
                 expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
            });
        });
    });
});
