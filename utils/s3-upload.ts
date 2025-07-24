export async function uploadImageToS3(file: File, oldKey?: string | null): Promise<string> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  console.log("fileExtension: ",fileExtension)
  if (!["jpg", "jpeg", "png"].includes(fileExtension || "")) {
    throw new Error("Only JPG and PNG images are allowed");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image size must be less than 5MB");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    if (oldKey) {
      formData.append("oldKey", oldKey);
    }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}