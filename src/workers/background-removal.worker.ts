import { removeBackground, type Config } from "@imgly/background-removal";

type WorkerRequest = {
  file: File;
};

type WorkerResponse =
  | { type: "progress"; message: string }
  | { type: "success"; blob: Blob }
  | { type: "error"; error: string };

const worker = self;
let modelLoaded = false;

const config: Config = {
  output: {
    format: "image/png"
  },
  progress: (_key: string, current: number, total: number) => {
    if (!total) {
      return;
    }

    const percent = Math.round((current / total) * 100);

    if (current >= total) {
      if (!modelLoaded) {
        modelLoaded = true;
        worker.postMessage({
          type: "progress",
          message: "Removing background... this can take 10-30 seconds."
        } satisfies WorkerResponse);
      }

      return;
    }

    worker.postMessage({
      type: "progress",
      message:
        "First-time setup: downloading the cutout model (~80MB). " +
        `This only happens once. ${percent}%`
    } satisfies WorkerResponse);
  }
};

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (modelLoaded) {
      worker.postMessage({
        type: "progress",
        message: "Removing background... this can take 10-30 seconds."
      } satisfies WorkerResponse);
    }

    const blob = await removeBackground(event.data.file, config);

    worker.postMessage({ type: "success", blob } satisfies WorkerResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Background removal failed.";
    const isModelLoadError =
      /fetch|network|staticimgly|onnx|wasm|load/i.test(message);

    worker.postMessage({
      type: "error",
      error: isModelLoadError
        ? "Couldn't load the cutout model."
        : `Cutout failed: ${message}`
    } satisfies WorkerResponse);
  }
};
