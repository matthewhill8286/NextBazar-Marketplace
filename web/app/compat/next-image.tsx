import supabaseImageLoader from "@/lib/supabase/image-loader";
import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  unoptimized?: boolean;
};

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  quality,
  style,
  ...rest
}: ImageProps) {
  const numericWidth =
    typeof width === "number" ? width : fill ? 1920 : Number(width) || 800;
  const resolved = supabaseImageLoader({
    src,
    width: numericWidth,
    quality,
  });

  if (fill) {
    return (
      <img
        src={resolved}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          ...style,
        }}
        {...rest}
      />
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={style}
      {...rest}
    />
  );
}
