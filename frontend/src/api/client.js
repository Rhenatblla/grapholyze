import axios from "axios";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

console.log("API BASE URL:", apiUrl);

const client = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // ⬅️ WAJIB untuk cookie auth
  headers: {
    "Content-Type": "application/json",
  },
});

// ❌ TIDAK ADA Authorization interceptor
// ❌ TIDAK ADA localStorage token

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan";

    return Promise.reject(new Error(message));
  }
);

export default client;
