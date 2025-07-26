import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Product } from "../types/Product";

const Home = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:8000/products/"
                );
                console.log("Fetched products:", response.data);
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1 className="text-4xl font-bold text-white">Product List</h1>
            <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {products.map((product) => (
                        <div
                            className="card bg-base-100 w-96 shadow-sm"
                            key={product.id}
                        >
                            <div className="card-body">
                                <h2 className="card-title">{product.name}</h2>
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
                                <div className="card-actions justify-end">
                                    <a
                                        href={product.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <button className="btn btn-primary">
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
