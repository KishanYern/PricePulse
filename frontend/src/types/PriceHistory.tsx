// Define the shape of a single price history record
export interface PriceHistoryItem {
    id: number;
    productName: string;
    productId: number;
    price: number;
    timestamp: string;
    source: string | null;
    notifications: boolean | null;
}

// Define the props for the search component
export interface PriceHistorySearchProps {
    productId: string | number;
    setProductId: (id: string | number) => void;
    productName: string;
    setProductName: (name: string) => void;
    notifications: string;
    setNotifications: (value: string) => void;
}

// Define the props for the results component
export interface PriceHistoryResultsProps {
    data: PriceHistoryItem[] | null;
    isLoading: boolean;
}
