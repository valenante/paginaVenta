// src/hooks/useImageUpload.js
import { useState } from "react";
import api from "../utils/api";

export function useImageUpload() {
    const [dragging, setDragging] = useState(false);

    const uploadProducto = async (file) => {
        const fd = new FormData();
        fd.append("file", file);

        const { data } = await api.post("/images/upload-producto", fd);

        if (!data?.imageUrl) throw new Error("UPLOAD_NO_URL");
        return data.imageUrl;
    };

    const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);

    const onDrop = async (e, setFormData) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const url = await uploadProducto(file);
        setFormData((prev) => ({ ...prev, img: url }));
        return file; // por si quieres setear preview
    };

    const onFileChange = async (e, setFormData) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await uploadProducto(file);
        setFormData((prev) => ({ ...prev, img: url }));
        return file;
    };

    return { dragging, onDragOver, onDragLeave, onDrop, onFileChange };
}
