import { useEffect, useState } from "react";
import type { PriceHistorySearchProps } from "../types/PriceHistory";
import axios from "axios";
import API_URL from "../apiConfig"

const PriceHistorySearch: React.FC<PriceHistorySearchProps> = ({
    productId,
    setProductId,
    productName,
    setProductName,
    notifications,
    setNotifications,
    userFilter,
    setUserFilter,
    isAdmin,
}) => {
    // Array to hold all the users in the system
    const [users, setUsers] = useState<{ id: number | null; email: string }[]>([]);

    // Fetch users from the API
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/`, {
                withCredentials: true,
            });
            setUsers([{ id: null, email: "" }, ...response.data]);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
                        onChange={(e) =>
                            setProductId(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
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
                {isAdmin && (
                    <div className="flex-1">
                        <label
                            htmlFor="userFilter"
                            className="block text-sm font-medium text-gray-300 mb-1"
                        >
                            User Filter
                        </label>
                        <select
                            className="mt-1 block w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                            name="userFilter"
                            id="userFilter"
                            value={userFilter || ""}
                            onChange={(e) =>
                                setUserFilter(
                                    e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                )
                            }
                        >
                            {users.map((user) => {
                                if (!user.id) return (
                                    <option key="empty" value=""/>
                                );
                                return (
                                    <option key={user.id} value={user.id}>
                                        {user.email}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceHistorySearch;
