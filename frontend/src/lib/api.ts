/**
 * Centralized API configuration for the ARENA frontend.
 * Reads from NEXT_PUBLIC_API_URL in production or defaults to http://localhost:8000 for local development.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
