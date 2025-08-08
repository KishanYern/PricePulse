import { useState } from "react";
import PriceHistorySearch from "../components/PriceHistorySearch";
import PriceHistoryResults from "../components/PriceHistoryResults";
import type { PriceHistoryItem } from "../types/PriceHistory";

const PriceHistoryPage = () => {
    const [productId, setProductId] = useState<string>("");
    const [productName, setProductName] = useState<string>("");
    const [notifications, setNotifications] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<
        PriceHistoryItem[] | null
    >(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSearch = async () => {
        setIsLoading(true);
        setSearchResults(null); // Clear previous results

        try {
            // Use Test data for now till I build the API Route
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const mockData: PriceHistoryItem[] = [
                { id: 1, productId: 1, price: 19.99, timestamp: "2024-07-01", source: "Store A" },
                { id: 2, productId: 1, price: 21.5, timestamp: "2024-07-05", source: "Store B" },
                { id: 3, productId: 1, price: 18.75, timestamp: "2024-07-10", source: "Store C" },
            ];

            const data = mockData;
            setSearchResults(data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setSearchResults([]); // Set to empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setProductId("");
        setProductName("");
        setNotifications(false);
        setSearchResults(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white p-8 font-sans">
            <h1 className="text-4xl font-extrabold text-blue-400 mb-8">
                Product Price History
            </h1>
            <PriceHistorySearch
                productId={productId}
                setProductId={setProductId}
                productName={productName}
                setProductName={setProductName}
                notifications={notifications}
                setNotifications={setNotifications}
            />
            <div className="mt-6 flex space-x-4">
                <button
                    onClick={handleSearch}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md cursor-pointer font-semibold hover:bg-blue-700 transition-colors duration-200 ease-in-out"
                >
                    Search
                </button>
                <button
                    onClick={handleClear}
                    className="bg-gray-600 text-white py-2 px-4 rounded-md cursor-pointer font-semibold hover:bg-gray-700 transition-colors duration-200 ease-in-out"
                >
                    Clear
                </button>
            </div>
            <PriceHistoryResults data={searchResults} isLoading={isLoading} />
        </div>
    );
};

export default PriceHistoryPage;
