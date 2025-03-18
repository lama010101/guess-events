
import React, { createContext, useContext } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { signIn, signUp, signOut, updateProfile } from '@/services/authService';
import { updateUserAvatar } from '@/services/avatarService';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, user, profile, isLoading, fetchProfile, setProfile } = useAuthSession();
  const { toast: uiToast } = useToast();

  // Sign in wrapper with UI toast
  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    
    if (!result.error) {
      uiToast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    } else {
      uiToast({
        title: 'Sign in failed',
        description: result.error.message,
        variant: 'destructive',
      });
    }
    
    return result;
  };

  // Sign up wrapper with UI toast
  const handleSignUp = async (email: string, password: string, username: string) => {
    const result = await signUp(email, password, username);
    
    if (!result.error) {
      uiToast({
        title: 'Welcome to HistoryGuessr!',
        description: 'Your account has been created successfully.',
      });
    } else {
      uiToast({
        title: 'Registration failed',
        description: result.error.message,
        variant: 'destructive',
      });
    }
    
    return result;
  };

  // Sign out wrapper with UI toast
  const handleSignOut = async () => {
    const result = await signOut();
    
    uiToast({
      title: 'You have been signed out',
      description: 'Come back soon!',
    });
    
    if (result.error) {
      uiToast({
        title: 'Sign out failed',
        description: 'Please try again',
        variant: 'destructive',
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
      
      uiToast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
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
      
      uiToast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
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
