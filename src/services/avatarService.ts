
import { uploadAvatar } from '@/integrations/supabase/storage';
import { toast } from 'sonner';
import { updateProfile } from './authService';

export async function updateUserAvatar(userId: string, file: File) {
  try {
    if (!userId) return { error: new Error('User not logged in'), url: null };
    
    console.log("Starting avatar upload process for user:", userId);
    
    // Upload the avatar
    try {
      const publicUrl = await uploadAvatar(userId, file);
      
      if (!publicUrl) {
        throw new Error('Upload failed: No public URL returned');
      }
      
      console.log("Avatar uploaded successfully, updating profile with URL:", publicUrl);
      
      // Update the profile with the new avatar URL
      const { error } = await updateProfile(userId, { avatar_url: publicUrl });
      
      if (error) {
        console.error('Error updating profile with avatar URL:', error);
        return { error, url: null };
      }
      
      toast("Your profile picture has been updated successfully.", {
        position: "top-center",
      });
      
      return { error: null, url: publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast("Unable to upload avatar. Please try again.", {
        position: "top-center",
      });
      return { error, url: null };
    }
  } catch (error) {
    console.error('Update avatar error:', error);
    toast("An unexpected error occurred. Please try again.", {
      position: "top-center",
    });
    return { error, url: null };
  }
}
