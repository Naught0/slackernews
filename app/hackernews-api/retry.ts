export async function retryPromise(promise: Promise<any>, retryCount = 1) {
  while (true) {
    try {
      return await promise;
    } catch (e) {
      if (retryCount < 1) break;
      retryCount--;
    }
  }
}
