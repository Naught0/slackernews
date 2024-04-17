async function request<T extends unknown>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const resp = await fetch(`https://api.hnpwa.com/v0${url}.json`, config);
  return (await resp.json()) as T;
}

export const getComments = async (postId: string) => {
  return await request<HNPWAItem>(`/item/${postId}`);
};
