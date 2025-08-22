import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../apiConfig';
import { useAuth } from '../AuthContext';
import type { User } from '../types/User';

interface SendNotificationModalProps {
  onClose: () => void;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/`, { withCredentials: true });
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users.');
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !message) {
      setError('Please select a user and enter a message.');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to send notifications. Try reloading the page.');
      return;
    }

    if (currentUser.id === selectedUserId) {
      setError('You cannot send a notification to yourself.');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/notifications/create_notification`,
        {
          from_user_id: currentUser.id,
          user_id: selectedUserId,
          message,
        },
        { withCredentials: true }
      );
      setSuccess('Notification sent successfully!');
      setMessage('');
      setSelectedUserId('');
      setError('');
    } catch (err) {
      setError('Failed to send notification.');
    }
  };

  return (
    <div className="modal-box">
      <h3 className="font-bold text-lg">Send a Notification</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Recipient</span>
          </label>
          <select
            className="select select-bordered"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
          >
            <option value="" disabled>
              Select a user
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Message</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </div>
        {error && <p className="text-error mt-2">{error}</p>}
        {success && <p className="text-success mt-2">{success}</p>}
      </form>
    </div>
  );
};

export default SendNotificationModal;