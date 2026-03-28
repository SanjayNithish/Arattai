import { api } from "./client";

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
