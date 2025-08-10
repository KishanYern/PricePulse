import { useState } from "react";
import { useAuth } from "../AuthContext"
import PriceHistorySearch from "../components/PriceHistorySearch";
import PriceHistoryResults from "../components/PriceHistoryResults";
import type { PriceHistoryItem } from "../types/PriceHistory";
import axios from "axios";

const PriceHistoryPage = () => {
    // Get the logged in user. This is needed to render user/admin specific fields
    const { isAdmin } = useAuth();

    const [productId, setProductId] = useState<number | string>("");
    const [productName, setProductName] = useState<string>("");
    const [notifications, setNotifications] = useState<string>("all");
    const [userFilter, setUserFilter] = useState<number | null>(null);
    const [searchResults, setSearchResults] = useState<
        PriceHistoryItem[] | null
    >(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const validateSearch = () => {
        // Convert productId to a number for validation
        const productIdNum = Number(productId);
        if (productId !== "" && isNaN(productIdNum)) {
            setError("Product ID must be a number if entered.");
            return false;
        }
        if (productId !== "" && productIdNum <= 0) {
            setError("Product ID must be a positive number.");
            return false;
        }
        setError(null);
        return true;
    };

    const handleSearch = async () => {
        if (!validateSearch()) {
            setSearchResults(null);
            return;
        }

        setIsLoading(true);
        setSearchResults(null); // Clear previous results

        try {
            // API call to get the products from the price history endpoint
            const response = await axios.get("http://localhost:8000/price-history/search-price-history", {
                params: {
                    product_id: productId,
                    name: productName,
                    notifications: notifications
                },
                withCredentials: true
            });
            console.log("Search results:", response.data);
            setSearchResults(response.data);
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
        setNotifications("all");
        setSearchResults(null);
        setIsLoading(false);
        setError(null);
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
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                isAdmin={isAdmin}
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
            {error && (
                <div className="mt-4 text-red-500">
                    {error}
                </div>
            )}
            <PriceHistoryResults data={searchResults} isLoading={isLoading} />
        </div>
    );
};

export default PriceHistoryPage;
