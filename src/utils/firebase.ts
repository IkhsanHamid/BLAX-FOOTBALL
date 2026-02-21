import { apiClient } from "./api";

class FirebaseService {
  async saveFCM(token: string, deviceId: string) {
    const response = await apiClient.post("/api/v1/firebase/save-fcm", {
      token,
      deviceId,
    });

    return response;
  }
}

export const firebaseService = new FirebaseService();
