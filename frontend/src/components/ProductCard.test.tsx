import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import ProductCard from './ProductCard';
import type { Product } from '../types/Product';

const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    url: 'http://example.com/product/1',
    imageUrl: 'http://example.com/image.jpg',
    source: 'Test Source',
    currentPrice: 100,
    highestPrice: 200,
    lowestPrice: 50,
    notes: null,
    lowerThreshold: null,
    upperThreshold: null,
    notify: false,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
};

describe('ProductCard', () => {
    it('should render product information correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
        expect(screen.getByText('Test Source')).toBeInTheDocument();
    });

    it('should have a correct link to the product page', () => {
        render(<ProductCard product={mockProduct} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/product/${mockProduct.id}`);
    });

    it('should show a placeholder if imageUrl is not provided', () => {
        const productWithoutImage = { ...mockProduct, imageUrl: undefined };
        render(<ProductCard product={productWithoutImage} />);
        expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
    });

    describe('PriceIndicator', () => {
        it('should show a down arrow when current price is the lowest', () => {
            const productAtLowest = { ...mockProduct, currentPrice: 50 };
            render(<ProductCard product={productAtLowest} />);
            const priceIndicator = screen.getByTestId('price-indicator-down');
            expect(priceIndicator).toBeInTheDocument();
        });

        it('should show an up arrow when current price is the highest', () => {
            const productAtHighest = { ...mockProduct, currentPrice: 200 };
            render(<ProductCard product={productAtHighest} />);
            const priceIndicator = screen.getByTestId('price-indicator-up');
            expect(priceIndicator).toBeInTheDocument();
        });

        it('should show an equals sign when current price is between lowest and highest', () => {
            render(<ProductCard product={mockProduct} />);
            const priceIndicator = screen.getByTestId('price-indicator-equal');
            expect(priceIndicator).toBeInTheDocument();
        });

        it('should show an equals sign when lowest or highest price is not available', () => {
            const productWithoutPrices = { ...mockProduct, lowestPrice: undefined, highestPrice: undefined };
            render(<ProductCard product={productWithoutPrices} />);
            const priceIndicator = screen.getByTestId('price-indicator-equal');
            expect(priceIndicator).toBeInTheDocument();
        });
    });
});
