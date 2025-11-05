const getMockDataPath = (route: string) => {
  if (route.includes("/roots")) {
    return "./mock/data/boms.json";
  }
  if (route.includes("/roots")) {
    return "./mock/data/tree-root.json";
  }
  if (route.includes("/workspace")) {
    return "./mock/data/workspace-details.json";
  }
  if (route.includes("/tree")) {
    return "./mock/data/tree.json";
  }
  if (route.includes("/catalog")) {
    return "./mock/data/catalog.json";
  }
};

export const MockAPI = {
  get: (url: string) => {
    return {
      json: async () => {
        const mockDataPath = getMockDataPath(url);
        // ⚠️ Dynamic import below runs only in dev/Node; it won't be bundled by Vite/Webpack builds.
        return (await import(/* @vite-ignore */ `${mockDataPath}`)).default;
      },
    };
  },
};
