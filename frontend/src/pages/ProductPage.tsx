import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaShoppingCart, FaChartLine, FaExclamationCircle } from "react-icons/fa";
import { MdImageNotSupported } from "react-icons/md";

// Types
import type { Product } from "../types/Product";

const ProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/products/${productId}`, {
                    withCredentials: true,
                });
                setProduct(response.data);
            } catch (error) {
                console.error("Error fetching product:", error);
                setError("Failed to load product details. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-lg loading-spinner text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen text-center">
                <FaExclamationCircle className="text-5xl text-error mb-4" />
                <h2 className="text-2xl font-bold text-error mb-2">An Error Occurred</h2>
                <p className="text-base-content/70">{error}</p>
                <Link to="/" className="btn btn-primary mt-6">
                    <FaArrowLeft />
                    Back to Home
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
             <div className="flex flex-col justify-center items-center min-h-screen text-center">
                <h2 className="text-2xl font-bold">Product not found</h2>
                <Link to="/" className="btn btn-primary mt-6">
                    <FaArrowLeft />
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 sm:p-8">
            <div className="container mx-auto">
                 {/* Back Button */}
                <div className="mb-6">
                    <Link to="/" className="btn btn-ghost">
                        <FaArrowLeft />
                        Back to Products
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Image and Main Details */}
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <figure className="flex-shrink-0 w-full md:w-1/3">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="rounded-lg object-cover w-full h-auto" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-48 bg-gray-300 rounded-lg">
                                                <MdImageNotSupported className="text-6xl text-gray-500" />
                                            </div>
                                        )}
                                    </figure>
                                    <div className="flex-grow">
                                        <div className="flex justify-end items-start">
                                            <div className="badge badge-primary">{product.source || "Unknown Source"}</div>
                                        </div>
                                        <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
                                        <p className="text-base-content/70 mt-4">{product.notes || "No additional notes for this product."}</p>

                                        <div className="divider my-6"></div>

                                        <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-200 w-full">
                                            <div className="stat">
                                                <div className="stat-title">Current Price</div>
                                                <div className="stat-value text-primary">${product.currentPrice?.toFixed(2)}</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-title">Highest Price</div>
                                                <div className="stat-value text-error">${product.highestPrice?.toFixed(2) || "N/A"}</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-title">Lowest Price</div>
                                                <div className="stat-value text-success">${product.lowestPrice?.toFixed(2) || "N/A"}</div>
                                            </div>
                                        </div>
                                         <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full mt-6">
                                            <FaShoppingCart />
                                            View on {product.source}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Price History and Actions */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="card bg-base-100 shadow-xl">
                             <div className="card-body items-center text-center">
                                <FaChartLine className="text-4xl text-accent"/>
                                <h2 className="card-title">Price History Chart</h2>
                                <p>A detailed chart showing the price history will be displayed here soon!</p>
                                <div className="w-full h-48 bg-base-300 rounded-lg flex items-center justify-center mt-4">
                                    <span className="text-base-content/50">Chart Placeholder</span>
                                </div>
                            </div>
                        </div>
                         <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title mb-4">Tracking Details</h2>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Notifications</span>
                                    {product.notify ? (
                                        <div className="badge badge-success gap-2">Enabled</div>
                                    ) : (
                                        <div className="badge badge-error gap-2">Disabled</div>
                                    )}
                                </div>
                                <div className="divider my-2"></div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-medium">Lower Threshold</span>
                                    <span className="font-mono text-warning">${product.lowerThreshold?.toFixed(2) || "Not Set"}</span>
                                 </div>
                                  <div className="divider my-2"></div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-medium">Upper Threshold</span>
                                    <span className="font-mono text-warning">${product.upperThreshold?.toFixed(2) || "Not Set"}</span>
                                 </div>
                                  <div className="divider my-2"></div>
                                <p className="text-xs text-base-content/60 mt-2">
                                    Last checked on {new Date(product.lastChecked).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;