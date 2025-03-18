
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types/auth';

export async function signIn(email: string, password: string) {
  try {
    console.log("Signing in with email:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in failed:", error.message);
      toast(`Sign in failed: ${error.message}`, {
        position: "top-center",
      });
      return { error };
    }
    
    console.log("Sign in successful:", data);
    toast("Welcome back! You have successfully signed in.", {
      position: "top-center",
    });
    
    return { error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error };
  }
}

export async function signUp(email: string, password: string, username: string) {
  try {
    console.log("Signing up with email:", email, "and username:", username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    
    if (error) {
      console.error("Registration failed:", error.message);
      toast(`Registration failed: ${error.message}`, {
        position: "top-center",
      });
      return { error };
    }
    
    console.log("Registration successful:", data);
    toast("Welcome to HistoryGuessr! Your account has been created successfully.", {
      position: "top-center",
    });
    
    return { error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error };
  }
}

export async function signOut() {
  try {
    console.log("Signing out...");
    await supabase.auth.signOut();
    toast("You have been signed out. Come back soon!", {
      position: "top-center",
    });
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    toast("Sign out failed. Please try again", {
      position: "top-center",
    });
    return { error };
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    if (!userId) return { error: new Error('User not logged in') };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) {
      toast(`Update failed: ${error.message}`, {
        position: "top-center",
      });
      return { error };
    }
    
    toast("Your profile has been updated successfully.", {
      position: "top-center",
    });
    
    return { error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error };
  }
}
