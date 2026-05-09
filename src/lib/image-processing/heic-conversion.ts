"use client";

type WorkerResponse =
  | { type: "progress"; message: string }
  | { type: "success"; file: File }
  | { type: "error"; error: string };

export function isHeicImage(file: File) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export async function convertHeicToJpeg(
  file: File,
  onProgress?: (message: string) => void
) {
  return new Promise<File>((resolve, reject) => {
    const worker = new Worker(
      new URL("../../workers/heic-conversion.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "progress") {
        onProgress?.(event.data.message);
        return;
      }

      if (event.data.type === "error") {
        worker.terminate();
        reject(new Error(event.data.error));
        return;
      }

      worker.terminate();
      resolve(event.data.file);
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || "HEIC conversion worker failed."));
    };

    worker.postMessage({ file });
  });
}
