import { createContext, useState } from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

export const ImageContext = createContext();

export const ImagesProvider = ({ children }) => {
  const [dragging, setDragging] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  /* ===============================
      DRAG & DROP
  =============================== */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const uploadToBackend = async (file, setFormData) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const { data } = await api.post(
        "/images/upload-image",
        formDataUpload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (data?.imageUrl) {
        setFormData((prev) => ({ ...prev, img: data.imageUrl }));
        setImageFile(file);
      }
    } catch (error) {
      logger.error("❌ Error subiendo imagen:", error);
    }
  };

  const handleDrop = async (e, setFormData) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await uploadToBackend(file, setFormData);
  };

  /* ===============================
      INPUT FILE
  =============================== */
  const handleFileChange = async (e, setFormData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadToBackend(file, setFormData);
  };

  return (
    <ImageContext.Provider
      value={{
        dragging,
        imageFile,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileChange,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};
