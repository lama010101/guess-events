
import { supabase } from './client';

// Helper to upload avatar images
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    // First check if the avatars bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    // If bucket doesn't exist, create it
    if (!avatarBucketExists) {
      await supabase.storage.createBucket('avatars', {
        public: true
      });
      console.log('Created avatars bucket');
    }
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
      
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    if (!data.publicUrl) {
      throw new Error('Failed to get public URL for avatar');
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw error;
  }
};

// Function to ensure avatars bucket exists
export const ensureAvatarsBucketExists = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    if (!avatarBucketExists) {
      const { error } = await supabase.storage.createBucket('avatars', {
        public: true
      });
      
      if (error) {
        console.error('Error creating avatars bucket:', error);
        return;
      }
      
      console.log('Created avatars bucket');
      
      // Create a policy to allow public access to avatars
      await supabase.storage.from('avatars').createSignedUrl('test.txt', 60);
    } else {
      console.log('Avatars bucket exists');
    }
  } catch (error) {
    console.error('Error ensuring avatars bucket exists:', error);
  }
};
