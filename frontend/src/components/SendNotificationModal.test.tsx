import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import SendNotificationModal from "./SendNotificationModal";
import type { User } from "../types/User";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Mock data
const mockUser: User = {
    id: 1,
    email: "test@example.com",
    admin: false,
};

const mockAdmin: User = {
    id: 2,
    email: "admin@example.com",
    admin: true,
};

const mockUsers: User[] = [mockUser, mockAdmin];

describe("SendNotificationModal", () => {
    const onClose = vi.fn();

    beforeEach(() => {
        mockedAxios.get.mockReset();
        mockedAxios.post.mockReset();
        mockedAxios.get.mockResolvedValue({ data: mockUsers });
    });

    it("should render correctly", async () => {
        mockedAxios.get.mockResolvedValue({ data: mockUsers });
        render(<SendNotificationModal onClose={onClose} />, { mockAuth: { isAuthenticated: true, user: mockUser } });
        
        // Use findBy queries, which automatically wait for the element to appear
        expect(await screen.findByText("Send a Notification")).toBeInTheDocument();
        expect(screen.getByLabelText(/recipient/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it("should fetch users on mount", async () => {
        mockedAxios.get.mockResolvedValue({ data: mockUsers });
        render(<SendNotificationModal onClose={onClose} />, { mockAuth: { isAuthenticated: true, user: mockUser } });
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(`http://localhost:8000/users/`, { withCredentials: true });
        });
        await waitFor(() => {
            expect(screen.getByText("Send a Notification")).toBeInTheDocument();
        });

        await waitFor(() => {
            const dropdown = screen.getByLabelText(/recipient/i);
            expect(dropdown).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'test@example.com' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'admin@example.com' })).toBeInTheDocument();
        });
    });

    it("should send notification on form submit", async () => {
        const user = userEvent.setup();
        mockedAxios.get.mockResolvedValue({ data: mockUsers });
        mockedAxios.post.mockResolvedValue({ data: { message: "Success" } });
        render(<SendNotificationModal onClose={onClose} />, { mockAuth: { isAuthenticated: true, user: mockUser } });
        // ACT: Wait for the component to finish loading users
        const recipientSelect = await screen.findByLabelText(/recipient/i);
        const messageInput = screen.getByLabelText(/message/i);
        const sendButton = screen.getByRole("button", { name: /send/i });

        // Simulate user actions
        await user.selectOptions(recipientSelect, mockAdmin.id.toString());
        await user.type(messageInput, "Hello World");
        await user.click(sendButton);
        
        // Check that the API call was made correctly
        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `http://localhost:8000/notifications/create_notification`, 
                {
                    from_user_id: mockUser.id,
                    user_id: mockAdmin.id,
                    message: "Hello World",
                },
                { withCredentials: true }
            );
        });
    });

    it("close button should close the modal", async () => {
        render(<SendNotificationModal onClose={onClose} />, { mockAuth: { isAuthenticated: true, user: mockUser } });
        await userEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(onClose).toHaveBeenCalled();
    });
});