export const updateUrl = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  }
};
