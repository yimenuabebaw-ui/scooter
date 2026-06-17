import { getStoredToken } from "./auth-storage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

const buildHeaders = (headers?: HeadersInit, body?: RequestOptions["body"]) => {
  const result = new Headers(headers);
  const token = typeof window !== "undefined" ? getStoredToken() : "";

  if (token) {
    result.set("Authorization", `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData) && !result.has("Content-Type")) {
    result.set("Content-Type", "application/json");
  }

  return result;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, options.body),
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined)
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const errorPayload = contentType.includes("application/json") ? await response.json() : null;

    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scooter-unauthorized", {
          detail: { message: errorPayload?.message ?? "Unauthorized" }
        })
      );
    }

    throw new Error(errorPayload?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiDownload(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: buildHeaders()
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("scooter-unauthorized", { detail: { message: "Unauthorized" } }));
    }
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="(.+)"/);

  return {
    blob,
    filename: match?.[1] ?? "download"
  };
}
