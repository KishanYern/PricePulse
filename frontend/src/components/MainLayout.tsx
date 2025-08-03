import React from "react";
import NavBar from "./NavBar";

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-grow">{children}</main>
        </div>
    );
};

export default MainLayout;
