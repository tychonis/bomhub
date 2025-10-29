import ky from "ky";
import { API_ROOT } from "./constants";
import { MockAPI } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

let api;

if (USE_MOCK) {
  console.log("[MOCK] Using local JSON data");
  api = MockAPI;
} else {
  api = ky.create({
    credentials: "include",
    hooks: {
      afterResponse: [
        async (_request, _options, response) => {
          if (response.status === 401) {
            const current = encodeURIComponent(window.location.href);
            window.location.href = `${API_ROOT}/login?redirect=${current}`;
          }
        },
      ],
    },
  });
}

export default api;
