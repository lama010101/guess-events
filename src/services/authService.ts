
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';

export async function signIn(email: string, password: string, persistSession: boolean = false) {
  try {
    console.log("Starting sign in process for:", email, "with persistence:", persistSession);
    
    // Configure the persistence level before signing in
    if (!persistSession) {
      // For non-persistent sessions, we'll set the session to be temporary
      // by configuring a short expiry in the browser
      sessionStorage.setItem('supabase-auth-temp-session', 'true');
    } else {
      // For persistent sessions, remove any temporary session marker
      sessionStorage.removeItem('supabase-auth-temp-session');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in failed:", error.message);
      return { error };
    }
    
    console.log("Sign in successful:", data.user?.id);
    return { error: null };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return { error };
  }
}

export async function signUp(email: string, password: string, username: string) {
  try {
    console.log("Starting registration process for:", email, username);
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
      return { error };
    }
    
    console.log("Registration successful:", data.user?.id);
    return { error: null };
  } catch (error) {
    console.error('Unexpected registration error:', error);
    return { error };
  }
}

export async function signOut(): Promise<{ error: any | null }> {
  try {
    console.log("Starting sign out process");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Sign out failed:", error.message);
      return { error };
    }
    
    console.log("Sign out successful");
    return { error: null };
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return { error };
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    if (!userId) {
      console.error("Update profile failed: No user ID provided");
      return { error: new Error('User not logged in') };
    }
    
    console.log("Updating profile for user:", userId, updates);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) {
      console.error("Profile update failed:", error.message);
      return { error };
    }
    
    console.log("Profile update successful");
    return { error: null };
  } catch (error) {
    console.error('Unexpected profile update error:', error);
    return { error };
  }
}
