import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils'; // Use custom render from our test utils
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

// Mock the useNavigate hook from react-router-dom, as it's used for redirection
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom'); // Import actual implementation
    return {
        ...actual, // Spread all actual exports
        useNavigate: () => mockedNavigate, // Override useNavigate with our mock
    };
});

describe('LoginForm', () => {
    // Create a mock login function to pass into our mock AuthContext
    const mockLogin = vi.fn();

    beforeEach(() => {
        // Reset mocks before each test to ensure a clean state
        mockedNavigate.mockClear();
        mockLogin.mockClear();
        // Mock window.alert as it's not implemented in JSDOM
        window.alert = vi.fn();
    });

    it('should render the login form correctly', () => {
        render(<LoginForm />, { mockAuth: { login: mockLogin } });

        // Check for email, password, and the sign-in button
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show validation errors for empty fields on submit', async () => {
        render(<LoginForm />, { mockAuth: { login: mockLogin } });
        const signInButton = screen.getByRole('button', { name: /sign in/i });

        await userEvent.click(signInButton);

        // Expect validation messages to appear
        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(await screen.findByText('Password is required')).toBeInTheDocument();

        // Ensure the login function was not called
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should call the login function and navigate on successful submission', async () => {
        // Arrange: mock the login function to resolve successfully
        mockLogin.mockResolvedValueOnce({ id: 1, email: 'test@test.com', admin: false });
        render(<LoginForm />, { mockAuth: { login: mockLogin } });

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const signInButton = screen.getByRole('button', { name: /sign in/i });

        // Act: fill out the form and submit
        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(signInButton);

        // Assert: check if login and navigate were called correctly
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockedNavigate).toHaveBeenCalledWith('/');
    });

    it('should show an error message on failed login', async () => {
        // Arrange: mock the login function to reject with an error
        mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
        render(<LoginForm />, { mockAuth: { login: mockLogin } });

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const signInButton = screen.getByRole('button', { name: /sign in/i });

        // Act: fill out the form and submit
        await userEvent.type(emailInput, 'wrong@example.com');
        await userEvent.type(passwordInput, 'wrongpassword');
        await userEvent.click(signInButton);

        // Assert: check for the error messages and that navigation did not occur
        const errorMessages = await screen.findAllByText('Invalid email or password');
        expect(errorMessages).toHaveLength(2); // Expect two error messages
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('should show a loading state while submitting', async () => {
        // Arrange: make the login promise never resolve to keep it in a loading state
        mockLogin.mockImplementationOnce(() => new Promise(() => {}));
        render(<LoginForm />, { mockAuth: { login: mockLogin } });

        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const signInButton = screen.getByRole('button', { name: /sign in/i });

        // Act: fill out the form and submit
        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(signInButton);

        // Assert: check for the disabled button and loading text
        const loadingButton = screen.getByRole('button', { name: /signing in/i });
        expect(loadingButton).toBeDisabled();
        expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });
});
