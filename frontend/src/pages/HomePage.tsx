import { useEffect, useState } from "react";
import axios from "axios";
import type { Product } from "../types/Product";
import { AddProduct } from "../components/AddProduct";
import { useAuth } from "../AuthContext"; // Import the AuthContext
import { Link } from "react-router";

const Home: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth(); // Get the user from AuthContext
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        const fetchData: () => Promise<void> = async () => {
            console.log(user);
            if(isLoading || !user) {
                console.error("User data is not available.");
                return;
            }

            setIsLoadingProducts(true);
            try {
                const response = await axios.get(
                    `http://localhost:8000/products/${user.id}/user-products`,
                    {
                        withCredentials: true, // Ensure cookies are sent with the request
                    }
                );

                if(!Array.isArray(response.data)) {
                    console.error("Expected an array of products, but received:", response.data);
                    setProducts([]);
                    return;
                }
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        if(isAuthenticated && user && !isLoading) {
            fetchData();
        }
    }, [isAuthenticated, user, isLoading]);

    if (isLoadingProducts) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <p className='text-white'>Loading products...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white text-lg">Please log in to view products.</p>
            </div>
        );
    }

    const handleProductAdded = (newProduct: Product) => {
        // when a new product is added, update the product list.
        setProducts((prevProducts) => [...prevProducts, newProduct]);
    };

    return (
        <div className="bg-gray-900">
            <div className="flex justify-between p-4">
                <h1 className='text-2xl font-bold text-white'>Your Products</h1>
                <button
                    className='btn btn-primary'
                    onClick={() => setShowAddProduct(!showAddProduct)}
                >
                    {showAddProduct ? "Hide Add Product" : "Add Product"}
                </button>
            </div>
            {showAddProduct && (
                <AddProduct onProductAdded={handleProductAdded} />
            )}
            <div className='min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4'>
                <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
                    {products.map((product) => (
                        <div
                            className='card bg-base-100 w-96 shadow-sm hover:shadow-lg transition-shadow duration-200 hover:scale-105'
                            key={product.id}
                        >
                            <Link to={`/product/${product.id}`} className='card-body'>
                                <h2 className='card-title'>
                                    {
                                    product.name.length > 50
                                        ? product.name.slice(0, 50) + "..."
                                        : product.name
                                    }
                                </h2>
                                <p>
                                    Product ID: {product.id}
                                </p>
                                <p>
                                    Current Price: $
                                    {product.currentPrice?.toFixed(2)}
                                </p>
                                <p>
                                    Lowest Price: $
                                    {product.lowestPrice?.toFixed(2) || "N/A"}
                                </p>
                                <p>
                                    Highest Price: $
                                    {product.highestPrice?.toFixed(2) || "N/A"}
                                </p>
                                {
                                    product.notify ? (
                                        <p className='text-green-500'>
                                            Notifications Enabled
                                        </p>
                                    ) : (
                                        <p className='text-red-500'>
                                            Notifications Disabled
                                        </p>
                                    )
                                }
                                <p>
                                    Last Checked:{" "}
                                    {new Date(
                                        product.lastChecked
                                    ).toLocaleDateString()}
                                </p>
                                <div className='card-actions justify-end'>
                                    <a
                                        href={product.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        <button className='btn btn-primary'>
                                            Buy Product!
                                        </button>
                                    </a>
                                </div>
                            </Link>
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Home;
