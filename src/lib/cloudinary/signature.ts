import { cloudinary } from "./config";

export function generateUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

export async function destroyCloudinaryAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
