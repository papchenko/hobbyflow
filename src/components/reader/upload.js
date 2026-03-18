// /src/reader/upload.js

export const uploadFile = async (file) => {
  const isImage = file.type.startsWith("image/");

  const url = isImage
    ? "https://api.cloudinary.com/v1_1/dggvnbw4a/image/upload"
    : "https://api.cloudinary.com/v1_1/dggvnbw4a/raw/upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "bookflow");

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  return data.secure_url;
};