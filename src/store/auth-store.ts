import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  loginWithCredentials: (email: string, password: string, selectedDomain: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      loginWithCredentials: async (email, password, selectedDomain) => {
        set({ isLoading: true });
        
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          }, {
            headers: {
              domain: selectedDomain,
            },
          });

          if (response.data.status) {
            const { token, admin: userFromBackend } = response.data.data;
            
            // Validate that the user's domain matches the selected domain
            if (userFromBackend.domain !== selectedDomain) {
              throw new Error(`User belongs to ${userFromBackend.domain} but tried to log in to ${selectedDomain}`);
            }
            
            // Create user object with selected domain
            const user = { 
              ...userFromBackend, 
              domain: selectedDomain,
              isAdmin: userFromBackend.is_admin || false,
              firstName: userFromBackend.first_name || '',
              lastName: userFromBackend.last_name || ''
            };
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);