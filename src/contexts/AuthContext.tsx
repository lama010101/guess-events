import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadAvatar } from '@/integrations/supabase/storage';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  default_distance_unit: 'km' | 'miles';
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  updateAvatar: (file: File) => Promise<{ error: any | null, url: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (error) {
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: 'Welcome to HistoryGuessr!',
        description: 'Your account has been created successfully.',
      });
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'You have been signed out',
        description: 'Come back soon!',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign out failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { error: new Error('User not logged in') };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        toast({
          title: 'Update failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      // Refresh profile data
      await fetchProfile(user.id);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const updateAvatar = async (file: File) => {
    try {
      if (!user) return { error: new Error('User not logged in'), url: null };
      
      console.log("Starting avatar upload process for user:", user.id);
      
      // Upload the avatar
      try {
        const publicUrl = await uploadAvatar(user.id, file);
        
        if (!publicUrl) {
          throw new Error('Upload failed: No public URL returned');
        }
        
        console.log("Avatar uploaded successfully, updating profile with URL:", publicUrl);
        
        // Update the profile with the new avatar URL
        const { error } = await updateProfile({ avatar_url: publicUrl });
        
        if (error) {
          console.error('Error updating profile with avatar URL:', error);
          return { error, url: null };
        }
        
        toast({
          title: 'Avatar updated',
          description: 'Your profile picture has been updated successfully.',
        });
        
        return { error: null, url: publicUrl };
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          title: 'Avatar update failed',
          description: 'Unable to upload avatar. Please try again.',
          variant: 'destructive',
        });
        return { error, url: null };
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      toast({
        title: 'Avatar update failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return { error, url: null };
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
