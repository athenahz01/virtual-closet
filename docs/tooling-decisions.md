# Tooling Decisions

Research date: May 9, 2026

## Summary table

| Need | Pick | Why | Monthly cost (my usage) |
| --- | --- | --- | --- |
| AI try-on | FASHN API `tryon-v1.6`, behind a provider interface | Best balance of quality, speed, fashion-specific controls, commercial/personal clarity, direct REST API, and low setup. Native input is one person image plus one garment, so multi-garment outfits should be chained. | About $7.50 for 50 final outfits if the average outfit needs 2 garment passes; $3.75 if one garment pass each. Minimum top-up is $7.50. |
| 3D avatar | Avaturn avatar creator + `@react-three/fiber` / `@react-three/drei` viewer | Free-tier developer subdomain, selfie-based avatar creation, GLB export through the official `@avaturn/sdk`, and enough likeness for a stylized closet mascot. | $0 |
| Bg removal | Browser-side `@imgly/background-removal`; keep `@bunnio/rembg-web` as license-friendly alternate | Free, private, no server/API bill, works directly in the upload flow. AGPL is acceptable for this personal app; if closed commercial use ever matters, swap. | $0 for 150 items; optional paid rescue with fal BRIA at $0.018/image. |

## A. AI Try-On

### Options evaluated

| Candidate | Cost | Quality notes | Multi-garment support | API ergonomics | License / use | Setup effort |
| --- | --- | --- | --- | --- | --- | --- |
| FASHN API `tryon-v1.6` | [1 credit/image, $0.075/credit on demand, $7.50 minimum top-up](https://help.fashn.ai/plans-and-pricing/api-pricing). At 50 final outfits: about $3.75 single-pass or $7.50 two-pass. | Strong current pick. [Docs list 864x1296 processing, 5-17s latency, performance/balanced/quality modes, segmentation-free mode, and flat-lay/model garment support](https://docs.fashn.ai/api-reference/tryon-v1-6). | Single garment image per call. Supports `tops`, `bottoms`, `one-pieces`, and `auto`; chain bottom -> top -> outerwear for outfits. | Clean REST `/v1/run`, polling status, URL or base64 input, optional base64 output for privacy. | [Commercial use available](https://fashn.ai/products/api); personal use is fine. | Signup + credits + API key. Lowest implementation risk. |
| FASHN VTON v1.5 self-hosted | Model is free; GPU hosting varies. On [Modal's $30/month free credits](https://modal.com/pricing?trk=public_post-text), 50-100 short inference jobs should fit if optimized. | Very attractive fallback: [Apache-2.0, pixel-space, maskless, about 8GB VRAM, 576x864 output](https://huggingface.co/fashn-ai/fashn-vton-1.5). Lower resolution than hosted v1.6. | Single category: `tops`, `bottoms`, `one-pieces`; chain for outfits. | Need to build/host Python inference service. | [Apache-2.0](https://github.com/fashn-AI/fashn-vton-1.5), unusually permissive for VTON. | Medium-high. Model weights, DWPose, human parser, GPU deployment. |
| Google Vertex Virtual Try-On | [Listed at $0.06/image](https://cloud.google.com/vertex-ai/generative-ai/pricing); 50 one-pass images = $3.00, two-pass = $6.00. New Google Cloud accounts may use general credits, not a durable app strategy. | Promising and cheap. [Preview API accepts one person image and one product image](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-virtual-try-on-images). Preview status means support/SLA may change. | One garment/product image. Chain for outfits. | Google Gen AI SDK / Vertex auth. More cloud setup than FASHN. | Preview terms allow production/commercial use, but "as is" pre-GA caveats apply. | Medium. GCP project, billing, service account. |
| Kling Kolors VTO via fal.ai | Price varies by access route; PiAPI lists [$0.07/output](https://piapi.ai/docs/kling-api/virtual-try-on-api). | Good-looking e-commerce examples, but more opaque than FASHN. [fal page calls it commercial-use, image-in/image-out](https://fal.ai/models/fal-ai/kling/v1-5/kolors-virtual-try-on). | fal route is single garment. PiAPI route supports `upper_input` + `lower_input`, which is valuable for top+bottom outfits. | fal queue/webhooks are nice; PiAPI gives task + webhook. | Commercial via hosted endpoints. Underlying model terms are less transparent than FASHN/Google. | Low-medium. |
| fal generic virtual try-on | [fal page shows $0.04/image](https://fal.ai/models/fal-ai/image-apps-v2/virtual-try-on). 50 = $2.00 single-pass. | Cheapest hosted route I found, but model identity and quality controls are less transparent. | Single clothing image. | Very easy with `@fal-ai/client`, queue, file upload. | fal marks commercial use. | Low. |
| fal FASHN `tryon/v1.6` | [fal lists $0.075/generation](https://fal.ai/models/fal-ai/fashn/tryon/v1.6), same as FASHN direct. | Same model family, convenient if using fal for other media. | Single garment. | Excellent JS client and queue. | Commercial use. | Low. |
| fal Leffa VTO | [fal lists $0.10/generation](https://fal.ai/models/fal-ai/leffa/virtual-tryon). | Good examples, commercial endpoint, but more expensive than FASHN and less directly aligned with multi-outfit needs. | Single garment with garment type. | Easy. | Commercial use via fal. | Low. |
| Replicate IDM-VTON | [About $0.025/run, A100, about 18s, 1.4M runs](https://replicate.com/cuuupid/idm-vton). | Strong older benchmark, good community trust. | Single garment/category. | Easy Replicate API. | [Non-commercial only / CC BY-NC-SA](https://replicate.com/cuuupid/idm-vton/readme). Fine for personal experiments, not future-proof. | Low. |
| Segmind IDM-VTON / SegFit | [IDM-VTON $0.0108/GPU-sec](https://www.segmind.com/models/idm-vton/pricing). SegFit v1.1 page showed about `$0.452`/generation at time of search. | Can be good, but cost/latency looked worse for this use case. | Varies by model; generally one try-on operation. | Standard API. | Hosted commercial terms; individual open model licenses may vary. | Low-medium. |
| CatVTON | Free weights; can run on local/Colab/HF/Modal. [<8GB VRAM for 1024x768](https://huggingface.co/camenduru/CatVTON). | Efficient and useful for experiments; not the highest quality now. | Single garment/category. | Need own pipeline or Space. | [CC BY-NC-SA 4.0](https://huggingface.co/annh/cvt), personal/non-commercial only. | Medium-high. |
| OOTDiffusion | Free weights; self-host GPU. | Older but influential. | Upper/lower/dress categories depending implementation. | More hands-on. | [CC BY-NC-SA 4.0 on HF](https://huggingface.co/OOTDiffusion/OOTDiffusion/blob/main/README.md). | Medium-high. |
| Hugging Face Spaces / Inference Endpoints | ZeroGPU can be free but quota-limited: [3.5 min/day free account, 25 min/day Pro, then $1/10 GPU-min](https://huggingface.co/docs/hub/main/spaces-zerogpu). Dedicated endpoints start around [GPU T4 $0.50/hr, A10G $1/hr](https://huggingface.co/docs/inference-endpoints/en/support/pricing). | Good for demos, not ideal for a private production API unless paid endpoint. | Depends on model. | Spaces are easiest for demos; endpoints are production. | Depends on model. | Medium. |
| RunPod / Modal self-host | RunPod serverless [A4000 flex $0.00016/sec, L4/A5000/3090 $0.00019/sec, A100 $0.00076/sec](https://docs.runpod.io/serverless/pricing). Modal has [$30/month free credits and per-second GPUs](https://modal.com/pricing?trk=public_post-text). | Best way to keep fallback cost near zero if using FASHN v1.5. | Depends on model. | Need container/service and cold-start handling. | Depends on model. | Medium-high. |

### Recommendation: FASHN API `tryon-v1.6`

Use FASHN API `tryon-v1.6` as the first implementation. It is not literally free, but it is low enough for the intended personal workload: the $7.50 minimum top-up covers 100 credits, which maps well to about 50 final outfits if most outfits require two chained garment passes. FASHN also has the clearest current fashion-specific controls: category selection, flat-lay vs model garment hints, segmentation-free mode, output format, speed/quality mode, and optional base64 output for privacy.

The main weakness is multi-garment support. The endpoint takes one garment image, so the app should compose outfits by chaining calls in a deterministic order: bottoms first, then top/dress, then outerwear; shoes/accessories should be marked "try-on experimental" because most VTON models are less reliable there. The provider abstraction in the build spec is exactly the right mitigation: store `provider`, `prompt_payload`, `cost_usd`, and the per-step intermediate URLs in `generations`.

Implementation default:

```ts
type TryOnProviderName = "fashn-v16" | "modal-fashn-v15" | "google-vto" | "kling-vto";

interface TryOnProvider {
  name: TryOnProviderName;
  generate(input: {
    personImage: string;
    garmentImages: Array<{ url: string; category: "tops" | "bottoms" | "one-pieces" | "outerwear" | "shoes" | "accessory" }>;
    pose: string;
    background: string;
  }): Promise<{ imageUrl: string; cost: number; providerPayload: unknown }>;
}
```

### Fallback: self-hosted FASHN VTON v1.5 on Modal

The best fallback is FASHN VTON v1.5 on Modal, because it is Apache-2.0, can run around 8GB VRAM, and Modal's $30/month free credits should cover this personal volume if the service is not kept warm all day. The tradeoff is engineering work and lower output resolution than hosted v1.6. I would not make this the first build path because the app has plenty of product surface area to build; paying a few dollars for hosted try-on is worth the saved time.

### Swap path

Keep a single `TryOnProvider` interface and make the provider configurable with `TRYON_PROVIDER`. If FASHN pricing rises above about $0.10 per pass, or if multi-garment chaining produces weak outfit results, run a 20-image bakeoff against:

1. Kling/PiAPI for `upper_input` + `lower_input` in one call.
2. Google Vertex Virtual Try-On for lower per-image price.
3. Modal-hosted FASHN v1.5 if free-tier cost matters more than resolution.

No UI rewrite should be required: only the server route and provider implementation change.

### Sample outputs reviewed

- [FASHN v1.6 fal sample/result JSON](https://fal.ai/models/fal-ai/fashn/tryon/v1.6)
- [FASHN v1.5 research examples and limitations](https://fashn.ai/research/vton-1-5)
- [FASHN v1.5 Hugging Face examples](https://huggingface.co/fashn-ai/fashn-vton-1.5)
- [Replicate IDM-VTON examples](https://replicate.com/cuuupid/idm-vton)
- [Kling VTO guide examples](https://kling.ai/quickstart/ai-virtual-try-on-guide)
- [fal Kling Kolors VTO sample](https://fal.ai/models/fal-ai/kling/v1-5/kolors-virtual-try-on)
- [fal Leffa VTO sample](https://fal.ai/models/fal-ai/leffa/virtual-tryon)

## B. 3D Avatar

### Options evaluated

| Candidate | Cost | Output | Likeness / style | Rigging / poses | License / use | Setup effort |
| --- | --- | --- | --- | --- | --- | --- |
| Avaturn | [Basic free: unlimited avatars/export; Pro $800/month for API/SDK/custom UX](https://avaturn.dev/pricing/). | [Exports GLB; FBX possible via conversion](https://docs.avaturn.me/docs/importing/unity/). | Selfie-based and more realistic than many stylized avatar generators. | Rigged humanoid avatars; external ecosystem support. | Need review project terms before commercial use; Basic uses Avaturn account/UX. | Low with developer subdomain and official SDK. |
| Meshcapade | Pricing not public in surfaced docs. | SMPL-based avatars from [photos, videos, measurements, scans, text](https://meshcapade.com/faq/). | Best conceptual fit for accurate body proportions and measurements. | Strong body model / motion stack. | Enterprise/B2B style. | High, likely overkill. |
| Didimo | B2B/digital-human product. Public pricing not clear in search results. | Head/character avatars, engine integrations. | Potentially strong facial likeness. | Good for real-time characters. | Needs vendor review. | Medium-high. |
| In3D | Mobile scan/body avatar product; public developer path unclear. | 3D body/avatar assets. | Better body scan possibility. | Depends export. | Unclear. | Medium-high. |
| VRoid Studio | Free desktop tool. | VRM/3D anime avatar. | Cute/stylized, but manual and not photo-to-avatar. | Good VRM humanoid rig. | Generally permissive for created models, subject to asset terms. | Medium, manual artist workflow. |
| Tripo3D / Meshy.ai | Free credits + paid credits vary; current pricing changes often. | Image/text-to-3D meshes, usually GLB/FBX/OBJ. | Better for objects/creatures than likeness-preserving personal avatar. | Rigging may be separate/limited. | Check generated asset terms per plan. | Medium. |

### Recommendation: Avaturn + React Three Fiber

Use Avaturn for the avatar creator flow. Avaturn keeps the important requirements intact for this personal app: selfie-based avatar creation, hosted creator UX, GLB export, and a clean official `@avaturn/sdk` integration. It will not perfectly encode 169cm / 112 lbs / 33B-24-27, but the closet mascot does not need measurement-accurate garment simulation. Measurements should remain in the profile as try-on context and future avatar metadata, not as an avatar-generation promise.

For rendering, use `@react-three/fiber` + `@react-three/drei`, not `model-viewer`, as the main path. `model-viewer` is excellent for a simple GLB viewer and supports [camera controls, auto-rotate, poster images, and animation](https://web.dev/model-viewer/), but the app wants a living mascot widget, controlled lighting, subtle idle behavior, and possible animation blending. R3F/drei gives us direct access to [Three.js GLTFLoader assets and animations](https://threejs.org/docs/pages/GLTFLoader.html), plus React-native composition.

### Fallback: manual GLB URL

If the embedded creator fails or the SDK callback does not return an export URL, use the manual GLB URL field in the app. The avatar viewer only needs a reachable HTTPS `.glb` URL, so the provider can still be swapped without rewriting the viewer.

### Cute/alive behavior

- Slow auto-rotate when idle; pause on pointer interaction.
- Subtle breathing: tiny sinusoidal torso/root scale or a real idle animation if present.
- Blink if the GLB has eye/morph targets; otherwise skip rather than fake it badly.
- Use [Mixamo animations](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) for optional idle poses; Adobe states Mixamo is free with an Adobe ID and royalty-free for personal, commercial, and nonprofit projects.
- Use warm studio lighting: `Environment`, soft contact shadows, parchment floor plane, no heavy 3D scene chrome.

### Sample outputs reviewed

- [Avaturn pricing and creator positioning](https://avaturn.dev/pricing/)
- [Avaturn GLB import docs](https://docs.avaturn.me/docs/importing/unity/)
- [model-viewer examples](https://modelviewer.dev/examples/animation/index.html)

## C. Background Removal

### Options evaluated

| Candidate | Cost | Quality / fit | Privacy | License / use | Setup effort |
| --- | --- | --- | --- | --- | --- |
| `@imgly/background-removal` | $0 API cost. Browser CPU/GPU time only. | Mature browser/Node package; good for item upload flow. [Repo has 7k+ stars and browser demo](https://github.com/imgly/background-removal-js). | Best: no third-party upload. | AGPL-3.0. OK for this personal app; not ideal for closed commercial redistribution. | Low. NPM package + worker. |
| `@bunnio/rembg-web` | $0 API cost. | Browser-native WASM with optional WebNN/WebGPU; supports [u2net, u2net cloth, isnet, silueta models](https://bunn-io.github.io/rembg-web/). | Best: no third-party upload. | MIT package; model licenses still need confirmation per model. | Low-medium; newer ecosystem than IMG.LY. |
| `rembg` Python | $0 API cost; server CPU/GPU cost only. [PyPI lists MIT](https://pypi.org/project/rembg/2.0.66/). | Battle-tested CLI/library/server. Models include U2Net/ISNet/BiRefNet variants. Good batch fallback. | Private if self-hosted. | MIT package; individual model weights vary. | Medium; not ideal inside Vercel serverless. |
| BRIA RMBG 2.0 via fal | [fal lists $0.018/image](https://fal.ai/models/fal-ai/bria/background/remove/playground). 150 items = $2.70. | Very strong professional cutouts; trained on licensed data. | Third-party upload. | Hosted endpoint is commercial-use; [open weights are CC BY-NC 4.0](https://github.com/Bria-AI/RMBG-2.0), so self-host commercial use needs BRIA license. | Low. |
| Photoroom Remove Background API | [$0.02/image; free sandbox/watermarked testing, Basic starts around $20/1000 images](https://docs.photoroom.com/remove-background-api-basic-plan/pricing). 150 images theoretical = $3, but plan minimum matters. | Excellent e-commerce/product-photo tooling. | Third-party upload. | Commercial API. | Low. |
| remove.bg | [Free low-res website use and 50 free API previews/month](https://www.remove.bg/help/a/is-remove-bg-free-%3F.class); high-res requires paid credits/subscription. | Reliable market leader, but costly at high-res. | Third-party upload. | Commercial paid plans. | Low. |
| Clipdrop | Public API path is less clear after ownership changes; third-party summaries list free/pro app tiers and developer API uncertainty. | Good editing suite, not necessary for pure background removal. | Third-party upload. | Need fresh terms before API use. | Low-medium. |
| BiRefNet direct | Free/self-host depending weights. | State-of-the-art segmentation family, but packaging and licensing vary. | Private if self-hosted. | Must check exact weight license. | Medium-high. |

### Recommendation: browser-side `@imgly/background-removal`

Use in-browser background removal first because wardrobe upload volume is small and privacy matters. This keeps garment photos on the device until the processed transparent PNG is ready to upload to Supabase. It also avoids adding a Python image-processing service during Phase 2.

The main caveat is AGPL-3.0. For this single-user personal app, that is acceptable. If the app later becomes closed commercial software or shared with other users, switch to `@bunnio/rembg-web` if quality is good enough, or a paid commercial API such as fal BRIA/Photoroom.

### Code-level integration sketch

```ts
// Client-only upload helper, ideally called from a Web Worker.
import { removeBackground } from "@imgly/background-removal";

export async function processGarmentImage(file: File) {
  const processedBlob = await removeBackground(file, {
    output: { format: "image/png" }
  });

  const processedFile = new File(
    [processedBlob],
    file.name.replace(/\.[^.]+$/, "-cutout.png"),
    { type: "image/png" }
  );

  return {
    original: file,
    processed: processedFile
  };
}
```

Upload both files:

- `items/{userId}/{itemId}/original.{ext}` -> `image_url`
- `items/{userId}/{itemId}/processed.png` -> `image_url_processed`

UX details:

- Run in a Web Worker so mobile Safari/Chrome do not freeze the form.
- Show original and processed preview side-by-side before saving.
- Add "Use original" and "Retry cutout" controls.
- If the browser runs out of memory or returns a bad cutout, mark the item as `processing_failed` locally and offer a paid fallback route later (`fal-bria` provider).
- Preserve the original image because try-on providers sometimes perform better with natural shadows than with a transparent PNG.

### Fallback: fal BRIA RMBG 2.0

For hard garment photos (busy backgrounds, lace, thin straps, pale garments on pale bedding), use fal BRIA RMBG 2.0 as an optional server route. At $0.018/image, processing all 150 wardrobe items would be about $2.70, but the browser route should keep the actual paid fallback much lower.

### Sample outputs reviewed

- [IMG.LY background removal demo/repo](https://github.com/imgly/background-removal-js)
- [BRIA RMBG 2.0 GitHub examples and license notes](https://github.com/Bria-AI/RMBG-2.0)
- [fal BRIA RMBG examples](https://fal.ai/models/fal-ai/bria/background/remove/examples)
- [Photoroom API docs](https://docs.photoroom.com/)
- [remove.bg free/API preview policy](https://www.remove.bg/help/a/is-remove-bg-free-%3F.class)

## Total estimated monthly cost

Baseline personal usage:

| Area | Assumption | Monthly cost |
| --- | --- | --- |
| AI try-on | 50 final outfit images/month, average 2 garment passes each, FASHN v1.6 at $0.075/pass | $7.50 |
| 3D avatar | Avaturn avatar creation + local R3F viewer | $0 |
| Background removal | 150 wardrobe items processed in browser | $0 |
| Optional bg-removal rescue | 10 hard images through fal BRIA at $0.018/image | $0.18 |

Expected baseline: **$7.50/month** for the AI tooling above, not counting Supabase/Vercel platform usage. If every try-on is a single garment pass, the true credit usage is $3.75/month, but FASHN's on-demand minimum purchase is $7.50. If try-on is moved to Modal-hosted FASHN v1.5 and stays within Modal's free credits, AI tooling can be near $0/month at the cost of more setup and lower resolution.
