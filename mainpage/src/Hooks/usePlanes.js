import { useEffect, useState } from "react";
import api from "../utils/api";

export default function usePlanes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get("/superadminPlans/publicPlans");
        setPlanes(data || []);
      } catch (err) {
        console.error("Error cargando planes:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return { planes, loading };
}
