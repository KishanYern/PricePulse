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

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div
            className="mt-8 overflow-x-auto"
            data-testid="price-history-results"
        >
            <table className="min-w-full table-auto border-collapse text-left">
                {/* Table Head */}
                <thead className="bg-gray-800 text-white font-semibold">
                    <tr>
                        <th className="p-3">Id</th>
                        {isAdmin && <th className="p-3">User Email</th>}
                        <th className="p-3">ProductId</th>
                        <th className="p-3">Name</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Notifications</th>
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody className="text-gray-300">
                    {data.map((item, index) => (
                        <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-800/50"
                        >
                            <td className="p-3">{item.id}</td>
                            {isAdmin && (
                                <td className="p-3 truncate max-w-xs">
                                    {item.userEmail}
                                </td>
                            )}
                            <td className="p-3">{item.productId}</td>
                            <td className="p-3">{item.productName}</td>
                            <td className="p-3 text-right">
                                ${item.price.toFixed(2)}
                            </td>
                            <td className="p-3">
                                {formatTimestamp(item.timestamp)}
                            </td>
                            <td className="p-3">{item.source}</td>
                            <td className="p-3">
                                {item.notifications ? "Enabled" : "Disabled"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PriceHistoryResults;
