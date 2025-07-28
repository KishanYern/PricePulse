import { useEffect, useState } from "react";
import axios from "axios";
import type { Product } from "../types/Product";
import { AddProduct } from "../components/AddProduct";
import { useAuth } from "../AuthContext"; // Import the AuthContext

const Home: React.FC = () => {
    const { isAuthenticated, user, isLoading, logout } = useAuth(); // Get the user from AuthContext
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchData: () => Promise<void> = async () => {
            if(!isAuthenticated || !user) {
                console.error("User is not authenticated or user data is not available.");
                return;
            }
            try {
                const response = await axios.get(
                    `http://localhost:8000/${user.id}/user-products/`,
                    {
                        withCredentials: true, // Ensure cookies are sent with the request
                    }
                );
                console.log("Fetched products:", response.data);

                if(!Array.isArray(response.data)) {
                    console.error("Expected an array of products, but received:", response.data);
                    return;
                }
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [isAuthenticated, user]);

    const handleProductAdded = (newProduct: Product) => {
        // when a new product is added, update the product list.
        setProducts((prevProducts) => [...prevProducts, newProduct]);
    };

    return (
        <div>
            {isLoading ? (
                <div className='flex items-center justify-center min-h-screen'>
                    <p className='text-white'>Loading...</p>
                </div>
            ) : !isAuthenticated ? (
                <div className='flex items-center justify-center min-h-screen'>
                    <p className='text-white'>
                        Please log in to view products.
                    </p>
                </div>
            ) : (
                <div className='flex items-center justify-between p-4 bg-gradient-to-r from-primary to-secondary'>
                    <h1 className='text-2xl font-bold text-white'>
                        Welcome, {user.email}!
                    </h1>
                    <button className='btn btn-secondary' onClick={logout}>
                        Logout
                    </button>
                </div>
            ) : (
                <div className='flex items-center justify-center min-h-screen'>
                    <p className='text-white'>Loading user data...</p>
                </div>
            )}
            <div className='flex justify-between items-center p-4 bg-gradient-to-r from-primary to-secondary'>
                <h1 className='text-2xl font-bold text-white'>Price Tracker</h1>
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
                            <div className='card-body'>
                                <h2 className='card-title'>{product.name}</h2>
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
                            </div>
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Home;
