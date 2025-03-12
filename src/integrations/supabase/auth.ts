
import { supabase } from './client';
import { toast } from 'sonner';

// Helper functions for authentication with Google
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    
    if (error) {
      if (error.message?.includes('provider is not enabled')) {
        console.error('Google auth provider is not enabled in Supabase:', error);
        throw new Error('Google login is not properly configured. Please enable Google provider in Supabase dashboard.');
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
};

// Helper function for email authentication
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

// Helper function for signing out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper function for password reset
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  return { data, error };
};
