export function safeJSONStringify(obj: any, fallbackResult = "") {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallbackResult;
  }
}
export function safeJSONParse(text: string, fallbackResult = {}) {
  try {
    return JSON.parse(text);
  } catch {
    return fallbackResult;
  }
}
