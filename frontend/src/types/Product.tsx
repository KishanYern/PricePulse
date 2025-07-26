export interface Product {
    id: number;
    url: string;
    name: string;
    currentPrice: number;
    lowestPrice: number | null;
    highestPrice: number | null;
    createdAt: string;
    lastChecked: string;
}
