import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, AuthState } from "../AuthContext";

// Mock implementation of the User type
interface User {
    id: number;
    email: string;
    admin: boolean;
}

// Default mock state for the AuthContext
const defaultMockAuth: AuthState = {
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    isLoading: false,
    login: async () => ({ id: 1, email: "test@example.com", admin: false }),
    logout: () => {},
};

// Create a custom render function that includes providers
const renderWithProviders = (
    ui: ReactElement,
    {
        // Allow overriding the mock auth state for specific tests
        mockAuth = {},
        ...renderOptions
    }: { mockAuth?: Partial<AuthState> } & Omit<RenderOptions, "wrapper"> = {}
) => {
    // Combine the default mock auth state with any overrides
    const authValue = { ...defaultMockAuth, ...mockAuth };

    // If a user is provided in the mock, set isAuthenticated and isAdmin accordingly
    if (mockAuth.user) {
        authValue.isAuthenticated = true;
        authValue.isAdmin = mockAuth.user.admin;
    }

    // Define the wrapper component with all necessary providers
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={authValue}>
            <MemoryRouter>{children}</MemoryRouter>
        </AuthContext.Provider>
    );

    // Render the UI with the wrapper
    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override the render method with our custom one
export { renderWithProviders as render };
