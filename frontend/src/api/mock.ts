const getMockDataPath = (route: string) => {
  if (route.includes("/roots")) {
    return "./mock/data/tree-root.json";
  }
  if (route.includes("/workspace")) {
    return "./mock/data/workspace-details.json";
  }
};

export const MockAPI = {
  get: (url: string) => {
    return {
      json: async () => {
        const mockDataPath = getMockDataPath(url);
        // ⚠️ Dynamic import below runs only in dev/Node; it won't be bundled by Vite/Webpack builds.
        return (await import(`${mockDataPath}`)).default;
      },
    };
  },
};
