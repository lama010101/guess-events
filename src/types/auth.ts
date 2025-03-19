
export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  default_distance_unit: 'km' | 'miles';
};

export type AuthContextType = {
  session: import('@supabase/supabase-js').Session | null;
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  updateAvatar: (file: File) => Promise<{ error: any | null, url: string | null }>;
};
