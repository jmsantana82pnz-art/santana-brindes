import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  aspect?: "square" | "video" | "auto";
};

export function SmartImage({ className, aspect = "auto", onLoad, src, alt = "", ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const aspectCls =
    aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "";

  return (
    <div className={cn("relative overflow-hidden bg-muted", aspectCls, className)}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
          Sem imagem
        </div>
      ) : (
        src && (
          <img
            {...rest}
            src={src}
            alt={alt}
            loading={rest.loading ?? "lazy"}
            decoding={rest.decoding ?? "async"}
            onLoad={(e) => {
              setLoaded(true);
              onLoad?.(e);
            }}
            onError={() => setFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )
      )}
    </div>
  );
}
