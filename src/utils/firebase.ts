import { apiClient } from "./api";

class FirebaseService {
  async saveFCM(token: string) {
    const response = await apiClient.post("/api/v1/firebase/save-fcm", {
      token,
    });

    return response;
  }
}

export const firebaseService = new FirebaseService();
