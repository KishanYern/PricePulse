import type { PriceHistorySearchProps } from "../types/PriceHistory";

const PriceHistorySearch: React.FC<PriceHistorySearchProps> = ({
    productId,
    setProductId,
    productName,
    setProductName,
    notifications,
    setNotifications,
}) => {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
                Price History Search
            </h2>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <div className="flex-1">
                    <label
                        className="block text-sm font-medium text-gray-300 mb-1"
                        htmlFor="productId"
                    >
                        Product ID
                    </label>
                    <input
                        className="mt-1 block w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                        type="number"
                        id="productId"
                        placeholder="Enter Product ID"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                </div>
                <div className="flex-1">
                    <label
                        className="block text-sm font-medium text-gray-300 mb-1"
                        htmlFor="productName"
                    >
                        Product Name
                    </label>
                    <input
                        className="mt-1 block w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                        type="text"
                        id="productName"
                        placeholder="Enter Product Name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label
                        className="block text-sm font-medium text-gray-300 mb-1"
                        htmlFor="notifications"
                    >
                        Notifications
                    </label>
                    <select
                        className="mt-1 block w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                        name="notifications"
                        id="notifications"
                        value={notifications}
                        onChange={(e) => setNotifications(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default PriceHistorySearch;
