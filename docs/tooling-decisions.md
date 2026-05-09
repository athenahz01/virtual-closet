# Tooling Decisions

Research date: May 9, 2026

## Pivot 2026-05-09

Replaced the 3D avatar path (Ready Player Me / Avaturn) and FASHN try-on
provider plan with Google Nano Banana Pro, exposed as Gemini 3 Pro Image. The
app now uses one image-generation provider for both clean studio avatar
references and outfit try-on images. See the commit log for implementation
context.

## Summary table

| Need | Pick | Why | Monthly cost (my usage) |
| --- | --- | --- | --- |
| AI try-on | Google Nano Banana Pro (`gemini-3-pro-image-preview`), behind a provider interface | One provider can generate the neutral avatar references and photoreal outfit try-on images from reference photos plus garment photos. | $0 within AI Studio free tier; about $6.70 for 50 paid images at $0.134/image. |
| Avatar reference | Google Nano Banana Pro (`gemini-3-pro-image-preview`) | Generates clean studio reference images from the Settings selfie, replacing the 3D mascot path. | $0 within AI Studio free tier; about $0.134/image beyond that. |
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

### Recommendation: Google Nano Banana Pro

Use Google Nano Banana Pro as the active try-on implementation. The pivot
consolidates avatar reference generation and outfit generation into one image
model, which is simpler than keeping separate avatar and virtual try-on
providers. The historical bakeoff table above remains as background research,
but the app no longer starts from a dedicated VTON API.

Implementation default:

```ts
type ImageGenProviderName = "gemini-nano-banana-pro";
```

The provider accepts the user's generated reference images plus selected garment
photos. The app-level contract stays provider-shaped, but the old single-garment
chaining model is removed.

### Historical fallback: self-hosted VTON

If Gemini proves unreliable for clothing fidelity, revisit self-hosted or hosted
VTON models. Keep this as a bakeoff idea, not active app architecture.

### Swap path

Keep a single Gemini image-generation interface for now. If pricing or quality
changes, run a 20-image bakeoff against:

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

## B. Avatar Reference Generation

### Options evaluated

| Candidate | Cost | Output | Likeness / style | Rigging / poses | License / use | Setup effort |
| --- | --- | --- | --- | --- | --- | --- |
| Avaturn | [Basic free: unlimited avatars/export; Pro $800/month for API/SDK/custom UX](https://avaturn.dev/pricing/). | [Exports GLB; FBX possible via conversion](https://docs.avaturn.me/docs/importing/unity/). | Selfie-based and more realistic than many stylized avatar generators. | Rigged humanoid avatars; external ecosystem support. | Need review project terms before commercial use; Basic uses Avaturn account/UX. | Low with developer subdomain and official SDK. |
| Meshcapade | Pricing not public in surfaced docs. | SMPL-based avatars from [photos, videos, measurements, scans, text](https://meshcapade.com/faq/). | Best conceptual fit for accurate body proportions and measurements. | Strong body model / motion stack. | Enterprise/B2B style. | High, likely overkill. |
| Didimo | B2B/digital-human product. Public pricing not clear in search results. | Head/character avatars, engine integrations. | Potentially strong facial likeness. | Good for real-time characters. | Needs vendor review. | Medium-high. |
| In3D | Mobile scan/body avatar product; public developer path unclear. | 3D body/avatar assets. | Better body scan possibility. | Depends export. | Unclear. | Medium-high. |
| VRoid Studio | Free desktop tool. | VRM/3D anime avatar. | Cute/stylized, but manual and not photo-to-avatar. | Good VRM humanoid rig. | Generally permissive for created models, subject to asset terms. | Medium, manual artist workflow. |
| Tripo3D / Meshy.ai | Free credits + paid credits vary; current pricing changes often. | Image/text-to-3D meshes, usually GLB/FBX/OBJ. | Better for objects/creatures than likeness-preserving personal avatar. | Rigging may be separate/limited. | Check generated asset terms per plan. | Medium. |

### Recommendation: Google Nano Banana Pro

Use Google Nano Banana Pro / Gemini 3 Pro Image for the avatar reference flow. The app now generates clean studio reference images from the Settings selfie and measurements, then feeds those same reference images into try-on generation. This removes the separate 3D avatar provider and GLB viewer.

The avatar page now renders generated reference images, not a 3D model. No 3D
viewer or embedded avatar creator is part of the active plan.

### Fallback: manual regenerated reference photo

If a generated reference image is not faithful enough, regenerate from the same Settings selfie or upload a cleaner reference photo before regenerating.

### Reference-image behavior

- Generate a neutral studio front reference first.
- Keep 1-4 reference paths on the profile for future front/back/side workflows.
- Use the first reference as the closet header thumbnail.

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
| AI try-on | 50 final outfit images/month, Nano Banana Pro at $0.134/image beyond free quota | $6.70 |
| Avatar reference | 1-4 generated reference images, Nano Banana Pro at $0.134/image beyond free quota | $0.13-$0.54 |
| Background removal | 150 wardrobe items processed in browser | $0 |
| Optional bg-removal rescue | 10 hard images through fal BRIA at $0.018/image | $0.18 |

Expected baseline: **$0/month inside AI Studio's free quota**, not counting
Supabase/Vercel platform usage. If usage moves to paid Gemini API pricing, 50
try-ons plus a small reference set is about **$7.24/month** at the current
planning estimate.
