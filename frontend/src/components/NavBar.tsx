import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose, IoNotifications } from "react-icons/io5";
import { FaHome, FaEnvelope, FaEnvelopeOpen } from "react-icons/fa";
import { AiOutlineHistory } from "react-icons/ai";
import SendNotificationModal from "./SendNotificationModal";

// Types
import type { Notification } from "../types/Notification";

const Navbar: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const { user, logout, notifications, markAsRead, markAsUnread } = useAuth();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLLabelElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

    useEffect(() => {
        const handleModalClickOutside = (event: MouseEvent) => {
            // Check if the click occurred outside the modalRef and not on the button that opens the modal
            if (
                isSendModalOpen &&
                modalRef.current &&
                !modalRef.current.contains(event.target as Node) &&
                event.target !== document.getElementById('send-notification-btn')
            ) {
                setIsSendModalOpen(false);
            }
        };

        if (isSendModalOpen) {
            document.addEventListener("mousedown", handleModalClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleModalClickOutside);
        };
    }, [isSendModalOpen]);

    const processNotification = (notification: Notification) => {
        if (notification.is_read) {
            markAsUnread(notification.id);
        } else {
            markAsRead(notification.id);
        }
    };

    return (
        <>
            <div className={`drawer ${isSidebarOpen ? "drawer-open" : ""}`}>
                <input
                    id="my-drawer-3"
                    type="checkbox"
                    className="drawer-toggle"
                    checked={isSidebarOpen}
                    readOnly
                />

                <div className="drawer-content flex flex-col">
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
                                    <div className="dropdown dropdown-end">
                                        <label tabIndex={0} className="btn btn-ghost btn-circle">
                                            <div className="indicator">
                                                <IoNotifications className="text-2xl" />
                                                {unreadCount > 0 && (
                                                    <span className="badge badge-xs badge-primary indicator-item">{unreadCount}</span>
                                                )}
                                            </div>
                                        </label>
                                        <div tabIndex={0} className="mt-3 card card-compact dropdown-content w-80 bg-base-200 shadow">
                                            <div className="card-body">
                                                <span className="font-bold text-lg">{notifications.length} Notifications</span>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {notifications.map(notification => (
                                                        <div key={notification.id} className={`p-2 rounded-md ${!notification.is_read ? 'bg-base-300' : ''}`}>
                                                            <p className="text-sm">{notification.message}</p>
                                                            <div className="text-xs text-right mt-1">
                                                                <button onClick={() => processNotification(notification)} className="link link-hover">
                                                                    {notification.is_read ? <FaEnvelopeOpen className="inline mr-1"/> : <FaEnvelope className="inline mr-1"/>}
                                                                    {notification.is_read ? 'Mark as Unread' : 'Mark as Read'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="card-actions">
                                                    <button 
                                                        className="btn btn-primary btn-block" 
                                                        onClick={() => setIsSendModalOpen(true)}
                                                        id="send-notification-btn"
                                                    >
                                                        Send Notification
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
            {isSendModalOpen && (
                <div className="modal modal-open">
                    <SendNotificationModal onClose={() => setIsSendModalOpen(false)} modalRef={modalRef} />
                </div>
            )}
        </>
    );
};

export default Navbar;