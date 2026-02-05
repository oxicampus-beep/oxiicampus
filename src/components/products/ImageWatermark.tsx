interface ImageWatermarkProps {
  sellerName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ImageWatermark = ({ sellerName, className = "", size = "md" }: ImageWatermarkProps) => {
  const sizeClasses = {
    sm: "text-sm gap-0.5",
    md: "text-lg gap-1",
    lg: "text-2xl gap-1.5",
  };

  return (
    <div className={`absolute inset-0 pointer-events-none select-none ${className}`}>
      {/* Centered watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`flex flex-col items-center ${sizeClasses[size]} text-white/40 font-bold tracking-wider rotate-[-25deg] drop-shadow-lg`}>
          <span className="uppercase">OxiCampus</span>
          {sellerName && (
            <span className="text-white/35 font-semibold text-[0.7em]">
              @{sellerName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageWatermark;
