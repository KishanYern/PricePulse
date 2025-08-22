import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import RegistrationForm from './RegistrationForm';

// Mock axios since the component uses it directly
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock the useNavigate hook from react-router-dom
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe('RegistrationForm', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockedNavigate.mockClear();
        mockedAxios.post.mockClear();
        window.alert = vi.fn();
    });

    it('should render the registration form correctly', () => {
        render(<RegistrationForm />);
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /i agree/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
        render(<RegistrationForm />);
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(await screen.findByText('Password is required')).toBeInTheDocument();
        expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
    });

    it('should show validation error for short password', async () => {
        render(<RegistrationForm />);
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), '1234');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    it('should show validation error for mismatched passwords', async () => {
        render(<RegistrationForm />);
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'password123');
        await userEvent.type(screen.getByPlaceholderText('Re-enter your password'), 'password456');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should call api and navigate on successful registration', async () => {
        mockedAxios.post.mockResolvedValue({ status: 201, data: { id: 1, email: 'test@example.com' } });
        render(<RegistrationForm />);

        await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'password123');
        await userEvent.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');
        await userEvent.click(screen.getByRole('checkbox', { name: /i agree/i }));
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:8000/users/create',
            { email: 'test@example.com', password: 'password123' },
            { withCredentials: true }
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should display error on failed registration', async () => {
        // This is a bit tricky because the component checks response.status inside the try block
        // A real axios error would throw and go to the catch block. Let's simulate the 400 status check.
        mockedAxios.post.mockResolvedValue({ status: 400, data: { detail: 'Email already exists' } });
        render(<RegistrationForm />);

        await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'password123');
        await userEvent.type(screen.getByPlaceholderText('Re-enter your password'), 'password123');
        await userEvent.click(screen.getByRole('checkbox', { name: /i agree/i }));
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText('Email already exists')).toBeInTheDocument();
        expect(mockedNavigate).not.toHaveBeenCalled();
    });
});
