import ky from "ky";

const api = ky.create({
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          // Redirect to your login page
          window.location.href = "/login";
        }
      },
    ],
  },
});

export default api;
