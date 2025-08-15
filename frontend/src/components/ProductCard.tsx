import { Link } from "react-router";
import { FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";
import { MdImageNotSupported } from "react-icons/md";

// Types
import type { Product } from "../types/Product";

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const PriceIndicator = () => {
        // If prices are not available, set the icon to indicate that no change occured
        if (!product.lowestPrice || !product.highestPrice) {
            return <FaEquals className="text-gray-500" />;
        }
        // If the current price is equal to both the lowest and highest prices, indicate no change
        if (
            product.currentPrice === product.lowestPrice &&
            product.currentPrice === product.highestPrice
        ) {
            return <FaEquals className="text-gray-500" />;
        }
        // If the current price is equal to the lowest price, indicate we are at an all time (in respect to this website's history) low
        if (product.currentPrice === product.lowestPrice) {
            return <FaArrowDown className="text-success" />;
        }
        // If the current price is equal to the highest price, indicate we are at an all time (in respect to this website's history) high
        if (product.currentPrice === product.highestPrice) {
            return <FaArrowUp className="text-error" />;
        }
        return <FaEquals className="text-gray-500" />;
    };

    return (
        <Link
            to={`/product/${product.id}`}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
        >
            <figure className="relative">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-48 w-full object-cover"
                    />
                ) : (
                    <MdImageNotSupported className="h-48 w-full object-cover" />
                )}
                <div className="absolute top-2 right-2 badge badge-accent font-semibold">
                    {product.source}
                </div>
            </figure>
            <div className="card-body p-5">
                <h2 className="card-title text-lg font-bold truncate group-hover:text-primary transition-colors">
                    {product.name}
                </h2>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <PriceIndicator />
                        <span className="text-2xl font-bold text-primary">
                            ${product.currentPrice?.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="text-xs text-base-content/70 mt-2 space-y-1">
                    <div className="flex justify-between">
                        <span>Lowest:</span>
                        <span className="font-semibold text-success">
                            ${product.lowestPrice?.toFixed(2) || "N/A"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Highest:</span>
                        <span className="font-semibold text-error">
                            ${product.highestPrice?.toFixed(2) || "N/A"}
                        </span>
                    </div>
                </div>

                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-sm btn-outline btn-primary">
                        View Details
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
