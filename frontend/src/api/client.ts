import axios from "axios";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const browserOrigin = window.location.origin;
const browserProtocol = window.location.protocol;
const browserHostname = window.location.hostname || "127.0.0.1";

const defaultApiOrigin = `${browserProtocol}//${browserHostname}:8000`;
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const configuredAssetBase = import.meta.env.VITE_ASSET_BASE_URL?.trim();
const configuredWsBase = import.meta.env.VITE_WS_BASE_URL?.trim();

export const API_BASE_URL = trimTrailingSlash(configuredApiBase || `${defaultApiOrigin}/api`);
export const ASSET_BASE_URL = trimTrailingSlash(configuredAssetBase || defaultApiOrigin);

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) return value ?? undefined;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${ASSET_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

export const getWsUrl = (token: string) => {
  const base =
    configuredWsBase ||
    `${browserOrigin.startsWith("https://") ? "wss" : "ws"}://${window.location.host}/api/ws`;
  const normalizedBase = trimTrailingSlash(base);
  return `${normalizedBase}?token=${token}`;
};
