import cloudinary from '../config/cloudinary';
import logger from './logger';

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'ecommerce'
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const uploadMultipleToCloudinary = async (
  filePaths: string[],
  folder: string = 'ecommerce'
): Promise<string[]> => {
  const uploadPromises = filePaths.map((path) => uploadToCloudinary(path, folder));
  return Promise.all(uploadPromises);
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
};
