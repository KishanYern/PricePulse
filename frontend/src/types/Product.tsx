export interface Product {
    id: number;
    url: string;
    name: string;
    currentPrice: number;
    lowestPrice: number | null;
    highestPrice: number | null;
    notes: string | null;
    lowerThreshold: number | null;
    upperThreshold: number | null;
    notify: boolean;
    createdAt: string;
    lastChecked: string;
}
