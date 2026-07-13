import axios from "axios";

const client = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "Terjadi kesalahan";

    return Promise.reject(new Error(message));
  },
);

export default client;
