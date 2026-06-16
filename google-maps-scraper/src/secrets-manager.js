import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Enterprise Secrets Manager
 * Handles secret retrieval from Environment Variables (K8s valueFrom)
 * and Volume Mounts (hardened K8s mounts).
 */

const SECRET_MOUNT_PATH = "/var/run/secrets/ai-jobs";

/**
 * Get a secret by key. 
 * Priority: 
 * 1. Environment Variable (Standard K8s/Docker)
 * 2. Volume Mount (Hardened K8s)
 */
export function getSecret(key) {
  // 1. Check Environment Variable
  const envVal = process.env[key];
  if (envVal) return envVal.trim();

  // 2. Check Volume Mount (e.g., /var/run/secrets/ai-jobs/GROQ_API_KEY)
  const mountPath = join(SECRET_MOUNT_PATH, key);
  if (existsSync(mountPath)) {
    try {
      return readFileSync(mountPath, "utf8").trim();
    } catch (e) {
      console.error(`Failed to read mounted secret ${key}:`, e.message);
    }
  }

  return null;
}

/**
 * Check if a secret exists without returning the value.
 */
export function hasSecret(key) {
  return Boolean(getSecret(key));
}
