import type { PriceHistoryResultsProps } from "../types/PriceHistory";
import { useAuth } from "../AuthContext";

const PriceHistoryResults: React.FC<PriceHistoryResultsProps> = ({
    data,
    isLoading,
}) => {
    const { isAdmin } = useAuth();

    if (isLoading) {
        return <div className="p-6 text-center text-white">Loading...</div>;
    }

    if (!data) {
        return null;
    }

    if (data.length === 0) {
        return <div className="p-6 text-center text-gray-400">No results.</div>;
    }

    return (
        <div className="mt-8">
            <div className="overflow-x-auto">
                <div className="flex text-white font-semibold border-b border-gray-700 pb-2 mb-2 min-w-max">
                    <div className="flex-1 px-2">Id</div>
                    {isAdmin && <div className="flex-2 px-2">User Email</div>}
                    <div className="flex-1 px-2">ProductId</div>
                    <div className="flex-3 px-2">Name</div>
                    <div className="flex-1 px-2">Price</div>
                    <div className="flex-2 px-2">Timestamp</div>
                    <div className="flex-1 px-2">Source</div>
                    <div className="flex-1 px-2">Notifications</div>
                </div>

                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex text-gray-300 py-2 border-b border-gray-700 hover:bg-gray-600 last:border-b-0 min-w-max"
                    >
                        <div className="flex-1 px-2">{item.id}</div>
                        {isAdmin && (
                            <div className="flex-2 px-2">{item.userEmail}</div>
                        )}
                        <div className="flex-1 px-2">{item.productId}</div>
                        <div className="flex-3 px-2">{item.productName}</div>
                        <div className="flex-1 px-2">
                            ${item.price.toFixed(2)}
                        </div>
                        <div className="flex-2 px-2">{item.timestamp}</div>
                        <div className="flex-1 px-2">{item.source}</div>
                        <div className="flex-1 px-2">
                            {item.notifications ? "Enabled" : "Disabled"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriceHistoryResults;
