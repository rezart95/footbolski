import axios from "axios";

export function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (!error.response) {
      return "Backend is offline or unreachable.";
    }
  }
  return fallback;
}
