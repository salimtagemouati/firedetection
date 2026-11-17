import { useState } from "react";
import { Upload } from "lucide-react";

interface Prediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface ImagePreviewProps {
  preview: string | null;
  predictions: Prediction[] | null;
}

export const ImagePreview = ({ preview, predictions }: ImagePreviewProps) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload className="w-12 h-12 text-slate-400 mb-4" />
        <p className="mb-2 text-sm text-slate-300">
          <span className="font-semibold">Click to upload</span>
        </p>
        <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 overflow-hidden">
      <img
        src={preview}
        alt="Preview"
        className="h-full w-full object-contain"
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />
      {imageSize.width > 0 && <svg className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}>
        {predictions?.map((p, i) => <rect key={i} x={p.x - p.width / 2} y={p.y - p.height / 2}
          width={p.width} height={p.height} fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke">
          <title>{p.class} ({Math.round(p.confidence * 100)}%)</title>
        </rect>)}
      </svg>}
    </div>
  );
};