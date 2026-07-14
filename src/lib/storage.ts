import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * File storage abstraction. Photos/documents are written through a driver so
 * the local-disk implementation can be swapped for S3 later without touching
 * callers. Uploaded photos are already compressed client-side (<=~1600px).
 */
export interface StorageDriver {
  /** Persist bytes and return the public path used to later fetch them. */
  save(key: string, data: Buffer, contentType: string): Promise<string>;
  /** Read bytes back (used by the file-serving route). */
  read(key: string): Promise<{ data: Buffer; contentType: string }>;
  delete(key: string): Promise<void>;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./.uploads";

function extFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  return map[contentType] ?? "";
}

class LocalStorageDriver implements StorageDriver {
  private metaFile(fullPath: string): string {
    return `${fullPath}.type`;
  }

  async save(key: string, data: Buffer, contentType: string): Promise<string> {
    const full = path.join(UPLOAD_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    await writeFile(this.metaFile(full), contentType, "utf8");
    // Files are served through /api/files/[...key] which reads UPLOAD_DIR.
    return `/api/files/${key}`;
  }

  async read(key: string): Promise<{ data: Buffer; contentType: string }> {
    const full = path.join(UPLOAD_DIR, key);
    const data = await readFile(full);
    let contentType = "application/octet-stream";
    try {
      contentType = (await readFile(this.metaFile(full), "utf8")).trim();
    } catch {
      // no sidecar — fall back to octet-stream
    }
    return { data, contentType };
  }

  async delete(key: string): Promise<void> {
    const full = path.join(UPLOAD_DIR, key);
    await unlink(full).catch(() => undefined);
    await unlink(this.metaFile(full)).catch(() => undefined);
  }
}

// S3-compatible driver stub for later. Wiring is left for when STORAGE_DRIVER=s3.
class S3StorageDriver implements StorageDriver {
  async save(): Promise<string> {
    throw new Error("S3 storage driver not yet implemented");
  }
  async read(): Promise<{ data: Buffer; contentType: string }> {
    throw new Error("S3 storage driver not yet implemented");
  }
  async delete(): Promise<void> {
    throw new Error("S3 storage driver not yet implemented");
  }
}

export const storage: StorageDriver =
  process.env.STORAGE_DRIVER === "s3"
    ? new S3StorageDriver()
    : new LocalStorageDriver();

/** Build a namespaced storage key, keeping tenant files grouped. */
export function buildKey(
  orgId: string,
  kind: string,
  contentType: string,
): string {
  return `${orgId}/${kind}/${randomUUID()}${extFromContentType(contentType)}`;
}
