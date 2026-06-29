import client from "./client";

export const adminApi = {
    getStats: async () => {
        return client.get("/api/admin/stats");
    },

    getUsers: async (page = 1, limit = 10, search = "") => {
        return client.get("/api/admin/users", {
            params: { page, limit, search }
        });
    },

    deleteUser: async (id) => {
        return client.delete(`/api/admin/users/${id}`);
    }
};
