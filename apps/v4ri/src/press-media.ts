import type { ContentImage } from "@itsvari/content";
import { pressPhotographVariants } from "./assets/press/variants";

export const pressKitUrl = "https://drive.google.com/drive/folders/1JCjAwvXgwJXvk4SJsPTUzE51jQZS_w0i";
export const pressPortrait = {
  src: "https://media.itsvari.com/cloudark/v1/press/20250801_7_FHD-1080w.webp",
  alt: "Masked V4RI reaches towards the camera under red and blue light.",
} satisfies ContentImage;

const defaultPhotographWidthPx = 1440;

export function responsivePressPhotograph(image: ContentImage, preferredWidthPx = defaultPhotographWidthPx) {
  const variants = pressPhotographVariants.get(image.src);
  const preferred = variants?.find((variant) => variant.width >= preferredWidthPx) ?? variants?.at(-1);
  return {
    ...image,
    src: preferred?.src ?? image.src,
    srcset: variants?.map((variant) => `${variant.src} ${variant.width}w`).join(", "),
    width: preferred?.width,
    height: preferred?.height,
  };
}
