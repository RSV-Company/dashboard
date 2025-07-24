/* eslint-disable @typescript-eslint/no-explicit-any */
export async function uploadImageToS3(file: File): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png"].includes(fileExtension || "")) {
    throw new Error("Only JPG and PNG images are allowed");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image size must be less than 5MB");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload image");
    }

    const { data, message } = await response.json();
    if (!data.publicUrl) {
      throw new Error(message || "No public URL returned");
    }

    return data.publicUrl;
  } catch (error: any) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}