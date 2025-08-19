import ky from "ky";

const api = ky.create({
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          const current = encodeURIComponent(window.location.href);
          window.location.href = `/login?redirect=${current}`;
        }
      },
    ],
  },
});

export default api;
