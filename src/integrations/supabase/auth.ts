
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
      // Handle provider not enabled error
      if (error.message?.includes('provider is not enabled') || 
          error.message?.includes('Unsupported provider')) {
        console.error('Google auth provider is not enabled in Supabase:', error);
        toast.error(
          'Google login is not configured. Please enable Google provider in Supabase dashboard.',
          { duration: 5000 }
        );
        return { data: null, error: new Error('Google login is not properly configured. Please enable Google provider in Supabase dashboard.') };
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
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      toast.error(error.message, { duration: 5000 });
    }
    
    return { data, error };
  } catch (error: any) {
    toast.error('Failed to sign in. Please try again.', { duration: 5000 });
    return { data: null, error };
  }
};

// Helper function for signing out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out. Please try again.', { duration: 5000 });
    }
    return { error };
  } catch (error: any) {
    toast.error('Failed to sign out. Please try again.', { duration: 5000 });
    return { error };
  }
};

// Helper function for password reset
export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      toast.error(error.message, { duration: 5000 });
    } else {
      toast.success('Password reset email sent!', { duration: 5000 });
    }
    
    return { data, error };
  } catch (error: any) {
    toast.error('Failed to send reset email. Please try again.', { duration: 5000 });
    return { data: null, error };
  }
};
