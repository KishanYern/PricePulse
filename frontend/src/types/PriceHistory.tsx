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
    userFilter: number | null;
    setUserFilter: (value: number | null) => void;
    isAdmin: boolean; // prop added to indicate if the logged in user is an admin
}

// Define the props for the results component
export interface PriceHistoryResultsProps {
    data: PriceHistoryItem[] | null;
    isLoading: boolean;
}
