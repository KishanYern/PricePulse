import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { AddProduct } from "../components/AddProduct";
import ProductCard from "../components/ProductCard";
import type { Product } from "../types/Product";

// Icons
import { FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const Home: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (isLoading || !user) return;

            setIsLoadingProducts(true);
            try {
                const response = await axios.get(
                    `http://localhost:8000/products/${user.id}/user-products`,
                    { withCredentials: true }
                );
                setProducts(Array.isArray(response.data) ? response.data : []);
                console.log("Fetched products:", response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setProducts([]);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        if (isAuthenticated && user && !isLoading) {
            fetchData();
        } else if (!isLoading) {
            setIsLoadingProducts(false);
        }
    }, [isAuthenticated, user, isLoading]);

    const handleProductAdded = (newProduct: Product) => {
        setProducts((prevProducts) => [newProduct, ...prevProducts]);
        setIsModalOpen(false); // Close modal on success
    };

    if (isLoading || isLoadingProducts) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-200">
                <span className="loading loading-ball loading-lg text-primary"></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Welcome to PricePulse
                    </h1>
                    <p className="text-base-content/70 mt-2">
                        Please log in to view and track your products.
                    </p>
                    <Link to="/login" className="btn btn-primary mt-6">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-base-200">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">
                                Your Tracked Products
                            </h1>
                            <p className="text-base-content/70 mt-1">
                                You are currently tracking {products.length}{" "}
                                items.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary btn-md shadow-lg"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FaPlus />
                            Add New Product
                        </button>
                    </div>

                    {/* Products Grid */}
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">🛒</div>
                            <h2 className="text-2xl font-bold mb-2">
                                Your list is empty!
                            </h2>
                            <p className="text-base-content/70 mb-6">
                                Click "Add New Product" to start tracking
                                prices.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Product Modal */}
            <dialog
                id="add_product_modal"
                className={`modal ${isModalOpen ? "modal-open" : ""}`}
            >
                <div className="modal-box w-11/12 max-w-2xl">
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <IoMdClose size={24} />
                        </button>
                    </form>
                    <AddProduct onProductAdded={handleProductAdded} />
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsModalOpen(false)}>close</button>
                </form>
            </dialog>
        </>
    );
};

export default Home;
