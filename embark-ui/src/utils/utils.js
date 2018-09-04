export function last(array) {
  return array && array.length ? array[array.length - 1] : undefined;
}
export function lastTimestamp(array) {
  return last(array.sort((a, b) => { return (a.timestamp || 0) - (b.timestamp || 0); }));
}
export function findByTimestamp(array, timestamp) {
  if(!(array && array.length && timestamp)) return undefined;
  return array.find(item => item.timestamp === timestamp);
}
/* eslint no-bitwise: "off" */
export function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
