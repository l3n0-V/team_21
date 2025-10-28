import axios from "axios";
import Constants from "expo-constants";

const baseURL = Constants.expoConfig?.extra?.API_BASE_URL || "http://127.0.0.1:8000";
const http = axios.create({ baseURL, timeout: 15000 });

export default {
  auth: {
    // mocked response for now
    async login({ email }) {
      return {
        ok: true,
        token: "dev-token",
        user: { id: "u1", email, name: "SNOP Tester", snops: 0 }
      };
    }
  },
  audio: {
    async upload(formData) {
      // when backend is ready:
      // return http.post("/audio/score", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return { data: { text: "hello world", pronunciationScore: 78, grammarTips: ["Mind the /r/"], snops: 5 } };
    }
  }
};
