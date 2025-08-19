import React, { useState } from "react";
import axios from "axios";
import type { Product } from "../types/Product";

interface AddProductProps {
    onProductAdded: (newProduct: Product) => void;
}

export const AddProduct = ({ onProductAdded }: AddProductProps) => {
    const [url, setUrl] = useState("");
    const [source, setSource] = useState("Amazon");
    const [notes, setNotes] = useState("");
    const [notify, setNotify] = useState(true);
    const [lowerThreshold, setLowerThreshold] = useState<number | null>(null);
    const [upperThreshold, setUpperThreshold] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            // Call the server to validate and add the product
            const response = await axios.post(
                "http://localhost:8000/products/create-product",
                {
                    "product": {
                        url,
                        source
                    },
                    "notes": notes,
                    "notify": notify,
                    "lowerThreshold": lowerThreshold,
                    "upperThreshold": upperThreshold
                },
                {
                    withCredentials: true, // Ensure cookies are sent with the request
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status !== 201) {
                // checking for errors from the server
                if (response.status === 400) {
                    setError(
                        "Product with this URL already exists or unable to scrape data."
                    );
                    console.error(response.data);
                } else if (response.status === 500) {
                    setError("Server error. Please try again later.");
                    console.error(response.data);
                }
                setLoading(false);
                return; // Stop execution after handling the error
            }

            console.log("Product added:", response.data);
            setUrl("");
            setSuccess("Product added successfully!");
            setLoading(false);
            onProductAdded(response.data); // Notify home page to add the new product to the list.
        } catch (error) {
            console.error("Error adding product:", error);
            setLoading(false);
            setError("Failed to add product. Please try again.");
        }
    };

    return (
        <div className='p-6'>
            <h2 className='text-lg font-bold mb-4 text-gray-300'>Add Product</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    placeholder='Enter product URL'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className='input input-bordered w-full'
                />
                <p className='text-sm text-gray-500 mb-4'>
                    Enter the product URL to track its price.
                </p>
                <select
                    className='select select-bordered w-full'
                    defaultValue='Amazon'
                    onChange={(e) => setSource(e.target.value)}
                >
                    <option value='Amazon'>Amazon</option>
                    <option value='eBay'>eBay</option>
                </select>
                <p className='text-sm text-gray-500 mb-4'>
                    Select the source of the product.
                </p>
                <input
                    type='text'
                    placeholder='Additional notes (optional)'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className='input input-bordered w-full'
                />
                <p className='text-sm text-gray-500 mb-4'>
                    Add any notes or comments about the product.
                </p>
                <div className='flex gap-4'>
                    <input
                        type='number'
                        placeholder='Lower Price Threshold (optional)'
                        value={lowerThreshold ?? ""}
                        onChange={(e) =>
                            setLowerThreshold(
                                e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                            )
                        }
                        className='input input-bordered w-full'
                    />
                    <input
                        type='number'
                        placeholder='Upper Price Threshold (optional)'
                        value={upperThreshold ?? ""}
                        onChange={(e) =>
                            setUpperThreshold(
                                e.target.value
                                    ? parseFloat(e.target.value)
                                    : null
                            )
                        }
                        className='input input-bordered w-full'
                    />
                </div>
                <p className='text-sm text-gray-500 mb-4'>
                    Set price thresholds to receive notifications when the price
                    goes below or above these values.
                </p>
                <div className='form-control'>
                    <label className='label cursor-pointer'>
                        <span className='label-text text-gray-400'>
                            Notify me when price changes
                        </span>
                        <input
                            type='checkbox'
                            checked={notify}
                            onChange={(e) => setNotify(e.target.checked)}
                            className='toggle toggle-primary ml-2'
                        />
                    </label>
                </div>
                <p className='text-sm text-gray-500 mb-4'>
                    Enable notifications to receive updates when the product
                    price changes.
                </p>
                <div className='mb-4'>
                    {loading ? (
                        <span role="progressbar" aria-label="loading" className='btn btn-primary loading loading-spinner loading-lg text-primary'></span>
                    ) : (
                        <button type='submit' className='btn btn-primary'>
                            Add Product
                        </button>
                    )}
                </div>
                {error && <p className='text-red-500'>{error}</p>}
                {success && <p className='text-green-500'>{success}</p>}
            </form>
        </div>
    );
};
