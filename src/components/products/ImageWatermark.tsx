interface ImageWatermarkProps {
  sellerName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ImageWatermark = ({ sellerName, className = "", size = "md" }: ImageWatermarkProps) => {
  const sizeClasses = {
    sm: "text-[8px] gap-0.5",
    md: "text-[10px] gap-1",
    lg: "text-sm gap-1.5",
  };

  return (
    <div className={`absolute inset-0 pointer-events-none select-none ${className}`}>
      {/* Diagonal watermark pattern */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className={`flex flex-col items-center ${sizeClasses[size]} text-white/20 font-semibold tracking-wider rotate-[-25deg]`}>
          <span className="uppercase">OxiCampus</span>
          {sellerName && (
            <span className="text-white/15 font-medium">
              @{sellerName}
            </span>
          )}
        </div>
      </div>
      
      {/* Bottom corner watermark */}
      <div className={`absolute bottom-2 right-2 flex flex-col items-end ${sizeClasses[size]} text-white/30 font-medium`}>
        <span className="uppercase tracking-wide drop-shadow-sm">OxiCampus</span>
        {sellerName && (
          <span className="text-white/25 text-[0.7em]">
            by {sellerName}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageWatermark;
