export type CloudinaryResourceType = "image" | "video";

export async function uploadToCloudinary(
  file: File,
  eventId: string,
  subfolder: string,
  resourceType: CloudinaryResourceType = "image",
): Promise<string> {
  const folder = `events/${eventId}/${subfolder}`;
  const sigRes = await fetch(
    `/api/upload/signature?eventId=${encodeURIComponent(eventId)}&folder=${encodeURIComponent(folder)}`,
  );
  const sigJson = await sigRes.json();
  if (!sigRes.ok) {
    throw new Error(sigJson.error?.message ?? "Не вдалося отримати підпис для завантаження");
  }

  const { signature, timestamp, cloudName, apiKey } = sigJson.data as {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Помилка завантаження");
  }

  return data.secure_url as string;
}
