
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { signIn, signUp, signOut, updateProfile } from '@/services/authService';
import { updateUserAvatar } from '@/services/avatarService';
import { toast } from 'sonner';
import { AuthContextType } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, user, profile, isLoading, fetchProfile } = useAuthSession();
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    if (!isLoading && !initialized) {
      console.log("Auth provider initialized", { session, user, profile });
      setInitialized(true);
    }
  }, [isLoading, session, user, profile, initialized]);

  // Sign in wrapper with UI toast
  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email);
      const result = await signIn(email, password);
      
      if (!result.error) {
        toast("Welcome back! You have successfully signed in.", {
          position: "top-center",
        });
      } else {
        console.error("Sign in error:", result.error);
        toast(`Sign in failed: ${result.error.message}`, {
          position: "top-center",
          style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
        });
      }
      
      return result;
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      toast(`An unexpected error occurred. Please try again.`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
      return { error };
    }
  };

  // Sign up wrapper with UI toast
  const handleSignUp = async (email: string, password: string, username: string) => {
    try {
      console.log("Attempting to register:", email, username);
      const result = await signUp(email, password, username);
      
      if (!result.error) {
        toast("Welcome to HistoryGuessr! Your account has been created successfully.", {
          position: "top-center",
        });
      } else {
        console.error("Registration error:", result.error);
        toast(`Registration failed: ${result.error.message}`, {
          position: "top-center",
          style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
        });
      }
      
      return result;
    } catch (error) {
      console.error("Unexpected registration error:", error);
      toast(`An unexpected error occurred. Please try again.`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
      return { error };
    }
  };

  // Sign out wrapper with UI toast
  const handleSignOut = async () => {
    try {
      console.log("Signing out user");
      const result = await signOut();
      
      if (!result.error) {
        toast("You have been signed out. Come back soon!", {
          position: "top-center",
        });
      } else {
        console.error("Sign out error:", result.error);
        toast("Sign out failed. Please try again", {
          position: "top-center",
          style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
        });
      }
      
      return result;
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      toast(`An unexpected error occurred. Please try again.`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
      return { error: error as Error };
    }
  };

  // Update profile wrapper with UI toast and profile refresh
  const handleUpdateProfile = async (updates: Partial<typeof profile>) => {
    try {
      if (!user) return { error: new Error('User not logged in') };
      
      console.log("Updating profile for user:", user.id, updates);
      const result = await updateProfile(user.id, updates);
      
      if (!result.error) {
        // Refresh profile data
        await fetchProfile(user.id);
        
        toast("Your profile has been updated successfully.", {
          position: "top-center",
        });
      } else {
        console.error("Profile update error:", result.error);
        toast(`Profile update failed: ${result.error.message}`, {
          position: "top-center",
          style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
        });
      }
      
      return result;
    } catch (error) {
      console.error("Unexpected profile update error:", error);
      toast(`An unexpected error occurred. Please try again.`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
      return { error: error as Error };
    }
  };

  // Update avatar wrapper with UI toast
  const handleUpdateAvatar = async (file: File) => {
    try {
      if (!user) return { error: new Error('User not logged in'), url: null };
      
      console.log("Updating avatar for user:", user.id);
      const result = await updateUserAvatar(user.id, file);
      
      if (!result.error) {
        // Refresh profile after avatar update
        await fetchProfile(user.id);
        
        toast("Your profile picture has been updated successfully.", {
          position: "top-center",
        });
      } else {
        console.error("Avatar update error:", result.error);
        toast(`Avatar update failed: ${result.error.message}`, {
          position: "top-center",
          style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
        });
      }
      
      return result;
    } catch (error) {
      console.error("Unexpected avatar update error:", error);
      toast(`An unexpected error occurred. Please try again.`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
      return { error: error as Error, url: null };
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    updateAvatar: handleUpdateAvatar,
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
