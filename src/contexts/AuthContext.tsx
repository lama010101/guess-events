
import React, { createContext, useContext } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { signIn, signUp, signOut, updateProfile } from '@/services/authService';
import { updateUserAvatar } from '@/services/avatarService';
import { toast } from 'sonner';
import { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, user, profile, isLoading, fetchProfile } = useAuthSession();

  // Sign in wrapper with UI toast
  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    
    if (!result.error) {
      toast("Welcome back! You have successfully signed in.", {
        position: "top-center",
      });
    } else {
      toast(`Sign in failed: ${result.error.message}`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
    }
    
    return result;
  };

  // Sign up wrapper with UI toast
  const handleSignUp = async (email: string, password: string, username: string) => {
    const result = await signUp(email, password, username);
    
    if (!result.error) {
      toast("Welcome to HistoryGuessr! Your account has been created successfully.", {
        position: "top-center",
      });
    } else {
      toast(`Registration failed: ${result.error.message}`, {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
    }
    
    return result;
  };

  // Sign out wrapper with UI toast
  const handleSignOut = async () => {
    const result = await signOut();
    
    toast("You have been signed out. Come back soon!", {
      position: "top-center",
    });
    
    if (result.error) {
      toast("Sign out failed. Please try again", {
        position: "top-center",
        style: { backgroundColor: '#fecaca', color: '#7f1d1d' }
      });
    }
  };

  // Update profile wrapper with UI toast and profile refresh
  const handleUpdateProfile = async (updates: Partial<typeof profile>) => {
    if (!user) return { error: new Error('User not logged in') };
    
    const result = await updateProfile(user.id, updates);
    
    if (!result.error) {
      // Refresh profile data
      await fetchProfile(user.id);
      
      toast("Your profile has been updated successfully.", {
        position: "top-center",
      });
    }
    
    return result;
  };

  // Update avatar wrapper with UI toast
  const handleUpdateAvatar = async (file: File) => {
    if (!user) return { error: new Error('User not logged in'), url: null };
    
    const result = await updateUserAvatar(user.id, file);
    
    if (!result.error) {
      // Refresh profile after avatar update
      await fetchProfile(user.id);
      
      toast("Your profile picture has been updated successfully.", {
        position: "top-center",
      });
    }
    
    return result;
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
