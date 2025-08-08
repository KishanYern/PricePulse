import type { PriceHistoryResultsProps } from "../types/PriceHistory";

const PriceHistoryResults: React.FC<PriceHistoryResultsProps> = ({
    data,
    isLoading,
}) => {
    if (isLoading) {
        return <div className="p-6 text-center text-white">Loading...</div>;
    }

    if (!data) {
        return null;
    }

    if (data.length === 0) {
        return (
            <div className="p-6 text-center text-gray-400">
                No results.
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-4 text-white border-b border-gray-700 pb-2 mb-2 font-semibold">
                    <div>Id</div>
                    <div>ProductId</div>
                    <div>Price</div>
                    <div>Timestamp</div>
                    <div>Source</div>
                </div>
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-5 gap-4 text-gray-300 py-2 border-b border-gray-700 hover:bg-gray-600 last:border-b-0"
                    >
                        <div>{item.id}</div>
                        <div>{item.productId}</div>
                        <div>${item.price.toFixed(2)}</div>
                        <div>{item.timestamp}</div>
                        <div>{item.source}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriceHistoryResults;
