import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { FaHome } from "react-icons/fa";
import { AiOutlineHistory } from "react-icons/ai";

const Navbar: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLLabelElement>(null);

    // Effect to handle clicks outside of the sidebar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click is outside the sidebar but not the toggle button itself
            const toggleButton = toggleButtonRef.current;
            if (
                isSidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                toggleButton &&
                !toggleButton.contains(event.target as Node)
            ) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSidebarOpen]);

    return (
        <div className={`drawer ${isSidebarOpen ? "drawer-open" : ""}`}>
            <input
                id="my-drawer-3"
                type="checkbox"
                className="drawer-toggle"
                checked={isSidebarOpen}
                readOnly
            />

            <div className="drawer-content flex flex-col">
                {/* Navbar */}
                <div className="w-full navbar bg-base-100 shadow-md">
                    <div className="flex-none">
                        <label
                            htmlFor="my-drawer-3"
                            aria-label="open sidebar"
                            className="btn btn-square btn-ghost"
                            id="sidebar-toggle-button"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            ref={toggleButtonRef}
                        >
                            {isSidebarOpen ? (
                                <IoClose className="text-2xl" />
                            ) : (
                                <GiHamburgerMenu className="text-2xl" />
                            )}
                        </label>
                    </div>
                    
                    <div className="flex-1 px-2 mx-2 font-bold text-xl">
                        Price Tracker
                    </div>

                    <div className="flex-none">
                        {user && (
                            <div className="flex items-center space-x-4 ml-4">
                                <span className="font-semibold text-sm">
                                    Hello, {user.email}!
                                    {
                                        user.admin ? (
                                            <span className=" text-red-500 ml-2">(Admin)</span>
                                        ) : null
                                    }
                                </span>
                                <button
                                    className="btn btn-sm btn-outline btn-error"
                                    onClick={logout}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="drawer-side" ref={sidebarRef}>
                {/* The drawer-overlay is what provides the faded background. */}
                <label
                    htmlFor="my-drawer-3"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></label>
                <ul className="menu p-4 w-80 min-h-full bg-base-200">
                    <div className="p-4 font-bold text-xl">Price Tracker</div>
                    <li onClick={() => setIsSidebarOpen(false)}>
                        <Link to="/">
                            <FaHome className="inline-block w-6 h-6 mr-2" />
                            Home
                        </Link>
                        <Link to='/price-history'>
                            <AiOutlineHistory className="inline-block w-6 h-6 mr-2" />
                            Price Histories
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Navbar;