"use client";

type WorkerResponse =
  | { type: "progress"; message: string }
  | { type: "success"; blob: Blob }
  | { type: "error"; error: string };

export async function removeGarmentBackground(
  file: File,
  onProgress?: (message: string) => void
) {
  return new Promise<File>((resolve, reject) => {
    const worker = new Worker(
      new URL("../../workers/background-removal.worker.ts", import.meta.url),
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
      resolve(
        new File([event.data.blob], file.name.replace(/\.[^.]+$/, "-cutout.png"), {
          type: "image/png"
        })
      );
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || "Background removal worker failed."));
    };

    worker.postMessage({ file });
  });
}
