async function request<T extends unknown>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const resp = await fetch(`https://api.hnpwa.com/v0${url}.json`, config);
  return (await resp.json()) as T;
}

export const getItem = async (postId: string | number) => {
  return await request<HNPWAItem>(`/item/${postId}`);
};
