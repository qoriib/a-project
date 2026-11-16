/**
 * API Configuration & Utilities
 * Centralized endpoint definitions and auth helpers for the Vendor Management System
 */

export const BASE_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:8000";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${BASE_URL}/api`;

export const STORAGE_BASE_URL =
  import.meta.env.VITE_STORAGE_URL || `${BASE_URL}/storage`;

/**
 * Mendapatkan token JWT / Sanction token dari localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem("token") || "";
};

/**
 * Mendapatkan data pengguna yang sedang login dari localStorage
 */
export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Gagal membaca auth user dari storage:", e);
    return null;
  }
};

/**
 * Format headers standar dengan autentikasi Bearer token
 * @param {boolean} isJson Apakah request mengirimkan body JSON
 * @param {Object} extraHeaders Header tambahan
 */
export const getAuthHeaders = (isJson = true, extraHeaders = {}) => {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Format path file dokumen ke URL storage yang valid
 * @param {string} path Lokasi file di server
 */
export const getStorageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.replace(/^\/?(storage\/)?/, "");
  return `${STORAGE_BASE_URL}/${cleanPath}`;
};

/**
 * URL untuk mengunduh / menampilkan PDF Formulir Vendor
 * @param {number|string} requestId ID dari vendor request
 */
export const getPdfUrl = (requestId) => {
  return `${API_BASE_URL}/vendor-requests/${requestId}/pdf`;
};

/**
 * Standard HTTP Fetch Wrapper dengan auto error handling dan auth header
 * @param {string} endpoint Path relatif atau absolut
 * @param {Object} options Fetch request options
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const isJson =
    options.body &&
    typeof options.body === "string" &&
    (!options.headers || !options.headers["Content-Type"]);

  const headers = getAuthHeaders(isJson, options.headers || {});

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJsonResponse = contentType && contentType.includes("application/json");

  let data;
  if (isJsonResponse) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.message) ||
      `Request gagal dengan status ${response.status}: ${response.statusText}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export default {
  BASE_URL,
  API_BASE_URL,
  STORAGE_BASE_URL,
  getAuthToken,
  getAuthUser,
  getAuthHeaders,
  getStorageUrl,
  getPdfUrl,
  apiFetch,
};
