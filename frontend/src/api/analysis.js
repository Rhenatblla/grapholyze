import client from "./client";

export const analysisApi = {
    uploadImage: async (imageData) => {
        return client.post("/api/analysis/upload", { imageData });
    },

    uploadCanvas: async (canvasData) => {
        return client.post("/api/analysis/canvas", { canvasData });
    },

    getHistory: async (userId, page = 1, limit = 10) => {
        return client.get(`/api/analysis/history/${userId}`, {
            params: { page, limit },
        });
    },

    getDetail: async (analysisId) => {
        return client.get(`/api/analysis/${analysisId}`);
    },
};

