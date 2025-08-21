export interface Notification {
  id: number;
  from_user_id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_email?: string; 
}