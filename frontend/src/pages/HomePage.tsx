import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { AddProduct } from "../components/AddProduct";
import ProductCard from "../components/ProductCard";

// types
import type { Product } from "../types/Product";
import type { User } from "../types/User";

// Icons
import { FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { TfiShoppingCart } from "react-icons/tfi";

const Home: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [userHomePage, setUserHomePage] = useState<number>(0);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [users, setUsers] = useState<User[]>([]);

    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initialize the user home page
    useEffect(() => {
        if (!user) {
            return;
        }
        if (user.admin){
            setUserHomePage(0);
        }
        else {
            setUserHomePage(user.id);
        }
    }, [user]);

    // Fetch the user products
    useEffect(() => {
        const fetchData = async () => {
            if (isLoading || !user) return;

            if (!user.admin && userHomePage === 0) return;

            setIsLoadingProducts(true);
            try {
                const response = await axios.get(
                    `http://localhost:8000/products/${userHomePage}/user-products`,
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
    }, [isAuthenticated, user, isLoading, userHomePage]);

    // Fetch all users for admin management
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("http://localhost:8000/users", {
                    withCredentials: true,
                });
                setUsers(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching users:", error);
                setUsers([]);
            }
        };

        fetchUsers();
    }, []);

    const handleProductAdded = (newProduct: Product) => {
        setProducts((prevProducts) => [newProduct, ...prevProducts]);
        setIsModalOpen(false); // Close modal on success
    };

    const handleUserManagementChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setUserHomePage(Number(event.target.value));
        console.log("User management changed to:", Number(event.target.value));
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <button
                                className="btn btn-primary btn-md shadow-lg"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <FaPlus />
                                Add New Product
                            </button>
                            {user?.admin && (
                                <select className="select select-bordered" onChange={handleUserManagementChange} value={userHomePage}>
                                    <option key={0} value={0}>
                                        All Products
                                    </option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.email}
                                            </option>
                                        ))}
                                    </select>
                                )
                            }
                        </div>
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
                            <div className="text-5xl mb-4 flex items-center justify-center">
                                <TfiShoppingCart size={48} />
                            </div>
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
