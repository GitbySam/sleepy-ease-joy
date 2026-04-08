import { useEffect, useRef, useState, useCallback } from "react";

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

const LazyVideo = ({ src, className, autoPlay = true, loop = true, muted = true, playsInline = true }: LazyVideoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (autoPlay) e.currentTarget.play().catch(() => {});
  }, [autoPlay]);

  return (
    <div ref={ref} className={className}>
      {isVisible && (
        <video
          src={src}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload="none"
          onCanPlay={handleCanPlay}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default LazyVideo;
