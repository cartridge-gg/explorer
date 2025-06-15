export const useDebounce = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number,
) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.call(null, ...args);
    }, delay);
  };
};
