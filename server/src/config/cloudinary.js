import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn(
      "[cloudinary] missing env — image upload endpoints will return 500 until CLOUDINARY_* are set"
    );
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
}

/**
 * Upload a buffer to Cloudinary under the given folder.
 * Returns { secure_url, public_id }.
 */
export async function uploadBuffer(buffer, folder = "agrilink/listings") {
  if (!configured) {
    throw new Error("Cloudinary is not configured — check server/.env");
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (err, result) => {
        if (err) return reject(err);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      })
      .end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!configured || !publicId) return null;
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
