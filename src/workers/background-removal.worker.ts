import { removeBackground, type Config } from "@imgly/background-removal";

type WorkerRequest = {
  file: File;
};

type WorkerResponse =
  | { type: "progress"; message: string }
  | { type: "success"; blob: Blob }
  | { type: "error"; error: string };

const worker = self;

const config: Config = {
  output: {
    format: "image/png"
  },
  progress: (_key: string, current: number, total: number) => {
    if (!total) {
      return;
    }

    const percent = Math.round((current / total) * 100);
    worker.postMessage({
      type: "progress",
      message: `Loading model ${percent}%`
    } satisfies WorkerResponse);
  }
};

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    worker.postMessage({
      type: "progress",
      message: "Preparing cutout..."
    } satisfies WorkerResponse);

    const blob = await removeBackground(event.data.file, config);

    worker.postMessage({ type: "success", blob } satisfies WorkerResponse);
  } catch (error) {
    worker.postMessage({
      type: "error",
      error:
        error instanceof Error
          ? error.message
          : "Background removal failed."
    } satisfies WorkerResponse);
  }
};
