import ky from "ky";
import { API_ROOT } from "./constants";

const api = ky.create({
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

export default api;
