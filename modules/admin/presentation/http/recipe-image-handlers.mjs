import { adminJson, getAdminAuthorizationFailure, getAdminServiceFailure, isSameOrigin } from "../../../../shared/http/admin-http.mjs";
import { MAX_RECIPE_IMAGE_BYTES, validateRecipeImage } from "../../../recipes/domain/image-validation.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MULTIPART_OVERHEAD_LIMIT = 64 * 1024;

async function readMultipartForm(request) {
  if (!/^multipart\/form-data\s*;/i.test(request.headers.get("content-type") || "")) return { error: "INVALID_REQUEST", status: 400 };
  const declaredLength = Number(request.headers.get("content-length") || 0);
  const maxBytes = MAX_RECIPE_IMAGE_BYTES + MULTIPART_OVERHEAD_LIMIT;
  if (declaredLength > maxBytes) return { error: "IMAGE_SIZE_INVALID", status: 413 };
  if (!request.body) return { error: "INVALID_REQUEST", status: 400 };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { error: "IMAGE_SIZE_INVALID", status: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const clone = new Request(request.url, { method: "POST", headers: request.headers, body: bytes });
    return { form: await clone.formData() };
  } catch {
    return { error: "INVALID_REQUEST", status: 400 };
  }
}

function uploadError(code) {
  if (code === "IMAGE_SIZE_INVALID") return adminJson({ error: code }, 413);
  if (code === "IMAGE_FORMAT_INVALID") return adminJson({ error: code }, 422);
  if (code === "INVALID_ORIGIN") return adminJson({ error: code }, 403);
  if (code === "INVALID_REQUEST") return adminJson({ error: code }, 400);
  return adminJson({ error: "IMAGE_OPERATION_UNAVAILABLE" }, 503);
}

export function createRecipeImageHandlers({ requireAdmin, isReady, createRepository, randomId = () => crypto.randomUUID(), logError = (...args) => console.error(...args) }) {
  async function authorize(request) {
    if (!isSameOrigin(request)) return { response: uploadError("INVALID_ORIGIN") };
    try { await requireAdmin(); return {}; }
    catch (error) { return { response: getAdminAuthorizationFailure(error) }; }
  }

  return {
    async POST(request, context) {
      const access = await authorize(request);
      if (access.response) return access.response;
      const { id } = await context.params;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      if (!isReady()) return adminJson({ error: "IMAGE_NOT_READY" }, 503);

      const parsed = await readMultipartForm(request);
      if (parsed.error) return uploadError(parsed.error);
      const files = parsed.form.getAll("file");
      if (files.length !== 1 || typeof files[0]?.arrayBuffer !== "function") return uploadError("IMAGE_FORMAT_INVALID");
      const file = files[0];
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validation = validateRecipeImage({ type: file.type, size: file.size, bytes });
      if (!validation.valid) return uploadError(validation.error);

      try {
        const repository = await createRepository();
        const oldPath = await repository.getRecipeImagePath(id);
        const newPath = `${id}/${randomId()}.${validation.extension}`;
        await repository.upload(newPath, bytes, file.type);
        try { await repository.attach(id, newPath); }
        catch (error) {
          try { await repository.remove([newPath]); } catch { /* cleanup is best-effort */ }
          throw error;
        }
        if (oldPath && oldPath !== newPath) {
          try { await repository.remove([oldPath]); }
          catch (error) { logError("[POST /api/admin/recipes/:id/image]", error?.code ?? "IMAGE_CLEANUP_FAILED"); }
        }
        let imageUrl = null;
        try { imageUrl = await repository.createSignedUrl(newPath); }
        catch (error) { logError("[POST /api/admin/recipes/:id/image]", error?.code ?? "IMAGE_URL_FAILED"); }
        return adminJson({ data: { image_path: newPath, image_url: imageUrl } }, 200);
      } catch (error) {
        logError("[POST /api/admin/recipes/:id/image]", error?.code ?? "UNKNOWN_ERROR");
        return getAdminServiceFailure(error);
      }
    },

    async DELETE(request, context) {
      const access = await authorize(request);
      if (access.response) return access.response;
      const { id } = await context.params;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      if (!isReady()) return adminJson({ error: "IMAGE_NOT_READY" }, 503);
      try {
        const repository = await createRepository();
        const oldPath = await repository.getRecipeImagePath(id);
        if (!oldPath) return adminJson({ data: { image_path: null, cleanupComplete: true } }, 200);
        await repository.attach(id, null);
        try {
          await repository.remove([oldPath]);
          return adminJson({ data: { image_path: null, cleanupComplete: true } }, 200);
        } catch (error) {
          logError("[DELETE /api/admin/recipes/:id/image]", error?.code ?? "IMAGE_CLEANUP_FAILED");
          return adminJson({ data: { image_path: null, cleanupComplete: false } }, 200);
        }
      } catch (error) {
        logError("[DELETE /api/admin/recipes/:id/image]", error?.code ?? "UNKNOWN_ERROR");
        return getAdminServiceFailure(error);
      }
    },
  };
}
