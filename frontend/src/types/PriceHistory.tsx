// Define the shape of a single price history record
export interface PriceHistoryItem {
    id: number;
    productId: number;
    price: number;
    timestamp: string;
    source: string | null;
}

// Define the props for the search component
export interface PriceHistorySearchProps {
    productId: string;
    setProductId: (id: string) => void;
    productName: string;
    setProductName: (name: string) => void;
    notifications: boolean;
    setNotifications: (value: boolean) => void;
}

// Define the props for the results component
export interface PriceHistoryResultsProps {
    data: PriceHistoryItem[] | null;
    isLoading: boolean;
}
