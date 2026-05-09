import heic2any from "heic2any";

type WorkerRequest = {
  file: File;
};

type WorkerResponse =
  | { type: "progress"; message: string }
  | { type: "success"; file: File }
  | { type: "error"; error: string };

const worker = self;

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    worker.postMessage({
      type: "progress",
      message: "Converting iPhone photo..."
    } satisfies WorkerResponse);

    const result = await heic2any({
      blob: event.data.file,
      toType: "image/jpeg",
      quality: 0.92
    });

    const blob = Array.isArray(result) ? result[0] : result;
    const convertedFile = new File(
      [blob],
      event.data.file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );

    worker.postMessage({
      type: "success",
      file: convertedFile
    } satisfies WorkerResponse);
  } catch (error) {
    worker.postMessage({
      type: "error",
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this iPhone photo."
    } satisfies WorkerResponse);
  }
};
