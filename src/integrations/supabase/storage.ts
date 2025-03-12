
import { supabase } from './client';

// Ensure avatars bucket exists
export const ensureAvatarsBucketExists = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    // If it doesn't exist, create it
    if (!avatarBucketExists) {
      const { error } = await supabase.storage.createBucket('avatars', {
        public: true
      });
      
      if (error) {
        console.error('Error creating avatars bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error ensuring avatars bucket exists:', error);
  }
};

// Helper function to upload avatar
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}.${fileExt}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
