import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import Navbar from './NavBar';

// Mock the useNavigate hook, as it's used within the AuthContext's logout function
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe('Navbar', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        mockLogout.mockClear();
        mockedNavigate.mockClear();
    });

    it('should render correctly when user is logged out', () => {
        render(<Navbar />, { mockAuth: { isAuthenticated: false, user: null } });

        // Title should always be visible
        expect(screen.getAllByText('Price Tracker').length).toBeGreaterThan(0);

        // User-specific elements should not be visible
        expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });

    it('should render correctly when a regular user is logged in', () => {
        const mockUser = { id: 1, email: 'user@example.com', admin: false };
        render(<Navbar />, { mockAuth: { isAuthenticated: true, user: mockUser } });

        // Check for user-specific elements
        expect(screen.getByText(`Hello, ${mockUser.email}!`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();

        // Admin badge should not be present
        expect(screen.queryByText('(Admin)')).not.toBeInTheDocument();
    });

    it('should render correctly when an admin user is logged in', () => {
        const mockAdmin = { id: 2, email: 'admin@example.com', admin: true };
        render(<Navbar />, { mockAuth: { isAuthenticated: true, user: mockAdmin } });

        // Check for user and admin specific elements
        expect(screen.getByText(`Hello, ${mockAdmin.email}!`)).toBeInTheDocument();
        expect(screen.getByText('(Admin)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should call the logout function when the logout button is clicked', async () => {
        const mockUser = { id: 1, email: 'user@example.com', admin: false };
        render(<Navbar />, { mockAuth: { isAuthenticated: true, user: mockUser, logout: mockLogout } });

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        await userEvent.click(logoutButton);

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should toggle the sidebar when the hamburger menu is clicked', async () => {
        render(<Navbar />, { mockAuth: { isAuthenticated: false, user: null } });

        const sidebarToggleButton = screen.getByLabelText(/open sidebar/i);
        const drawer = sidebarToggleButton.closest('.drawer');

        // Initially, the drawer should not be open
        expect(drawer).not.toHaveClass('drawer-open');

        // Click to open
        await userEvent.click(sidebarToggleButton);
        expect(drawer).toHaveClass('drawer-open');

        // Click to close
        await userEvent.click(sidebarToggleButton);
        expect(drawer).not.toHaveClass('drawer-open');
    });
});
