
export interface User {
  // Firebase UIDs are strings
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: 'user' | 'admin' | 'auditor' | 'billing';
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ScanResponse {
  id: number;
  project_id: number;
  status: string;
  scan_type: string;
  critical_count: number;
  high_count: number;
  created_at: string;
  output_data: any;
}

export interface ApiError {
  detail: string;
}
