import { v2 as cloudinary } from 'cloudinary';

function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({ cloud_name, api_key, api_secret });
    return true;
  }
  return false;
}

/**
 * Uploads an image string or base64 to Cloudinary and returns the Cloudinary HTTPS URL.
 * Never stores raw Base64 in MongoDB to prevent database storage bloat.
 */
export async function uploadImageToCloudinary(imageInput) {
  if (!imageInput || typeof imageInput !== 'string') return null;

  // If already an HTTP/HTTPS URL, return as is
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }

  // If Base64 string, upload to Cloudinary
  if (imageInput.startsWith('data:image')) {
    try {
      if (configureCloudinary()) {
        const result = await cloudinary.uploader.upload(imageInput, {
          folder: 'art-supply-exchange',
          resource_type: 'image'
        });
        console.log('Uploaded image to Cloudinary successfully:', result.secure_url);
        return result.secure_url;
      } else {
        // Cloudinary credentials not fully set; return raw base64 string
        return imageInput;
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error.message);
      return imageInput;
    }
  }

  return imageInput;
}

/**
 * Extracts public_id from Cloudinary URL and deletes image from Cloudinary storage
 */
export async function deleteCloudinaryImage(url) {
  if (!url || typeof url !== 'string') return;
  if (!url.includes('cloudinary.com')) return;

  try {
    if (configureCloudinary()) {
      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) return;

      let path = url.substring(uploadIndex + 8);
      // Strip version prefix if present (e.g. v1738912345/)
      path = path.replace(/^v\d+\//, '');

      // Remove extension
      const lastDot = path.lastIndexOf('.');
      const publicId = lastDot !== -1 ? path.substring(0, lastDot) : path;

      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary image destruction result for [${publicId}]:`, result);
      }
    }
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error.message);
  }
}

export default cloudinary;
