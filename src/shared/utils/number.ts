export function padNumber(num: number, size: number = 3) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

export function formatNumber(num: number) {
  return num.toLocaleString();
}
