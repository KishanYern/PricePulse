import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AddProduct } from './AddProduct';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('AddProduct', () => {
    const mockOnProductAdded = vi.fn();

    beforeEach(() => {
        mockOnProductAdded.mockClear();
        mockedAxios.post.mockClear();
    });

    it('renders the form correctly', () => {
        render(<AddProduct onProductAdded={mockOnProductAdded} />);
        expect(screen.getByPlaceholderText('Enter product URL')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
    });

    it('handles successful form submission', async () => {
        const newProduct = { id: 1, name: 'New Product', url: 'http://new.com', lastChecked: new Date().toISOString() };
        mockedAxios.post.mockResolvedValue({ status: 201, data: newProduct });

        render(<AddProduct onProductAdded={mockOnProductAdded} />);

        const urlInput = screen.getByPlaceholderText('Enter product URL');
        const submitButton = screen.getByRole('button', { name: /add product/i });

        await userEvent.type(urlInput, 'http://new.com');
        await userEvent.click(submitButton);

        // Check if axios was called correctly
        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8000/products/create-product',
                expect.objectContaining({
                    product: { url: 'http://new.com', source: 'Amazon' }
                }),
                expect.any(Object)
            );
        });

        // Check for success message and callback
        expect(await screen.findByText('Product added successfully!')).toBeInTheDocument();
        expect(mockOnProductAdded).toHaveBeenCalledWith(newProduct);

        // Check if form is cleared
        expect(urlInput).toHaveValue('');
    });

    it('handles failed form submission', async () => {
        mockedAxios.post.mockResolvedValue({
            status: 400,
            data: { detail: 'Product with this URL already exists.' }
        });

        render(<AddProduct onProductAdded={mockOnProductAdded} />);

        const urlInput = screen.getByPlaceholderText('Enter product URL');
        const submitButton = screen.getByRole('button', { name: /add product/i });

        await userEvent.type(urlInput, 'http://existing.com');
        await userEvent.click(submitButton);

        // Check for error message
        expect(await screen.findByText('Product with this URL already exists or unable to scrape data.')).toBeInTheDocument();

        // Ensure callback was not called
        expect(mockOnProductAdded).not.toHaveBeenCalled();
    });

    it('shows a loading state on submission', async () => {
        // Make the promise hang
        mockedAxios.post.mockImplementation(() => new Promise(() => {}));

        render(<AddProduct onProductAdded={mockOnProductAdded} />);

        const urlInput = screen.getByPlaceholderText('Enter product URL');
        const submitButton = screen.getByRole('button', { name: /add product/i });

        await userEvent.type(urlInput, 'http://any.com');
        await userEvent.click(submitButton);

        // The button is replaced by a loading spinner
        expect(screen.queryByRole('button', { name: /add product/i })).not.toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: /loading/i })).toBeInTheDocument();
    });
});
