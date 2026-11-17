import { useEffect, useRef, useState } from "react";
import { Flame, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ImagePreview } from "@/components/ImagePreview";
import { DetectionResults } from "@/components/DetectionResults";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Index = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const { toast } = useToast();

  const revision = useRef(0);
  const outstanding = useRef<AbortController>();
  useEffect(() => () => { ++revision.current; outstanding.current?.abort(); }, []);

  const handleReset = () => {
    ++revision.current;
    outstanding.current?.abort();
    setDetectionResult(null);
    setPreview(null);
    setImage(null);
    setIsLoading(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    handleReset();
    if (!file) return;
    const id = revision.current;
    try {
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024)
        throw new Error("Choose a PNG or JPEG up to 5 MB.");
      const bitmap = await createImageBitmap(file);
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (pixels > 16000000) throw new Error("Choose an image under 16 megapixels.");
      if (revision.current !== id) return;
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } catch (error) {
      if (revision.current === id) toast({ title: "Invalid image", description: String(error), variant: "destructive" });
    }
  };
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleSubmit = async () => {
    if (!image) return;
    const id = revision.current;
    const controller = new AbortController();
    outstanding.current = controller;
    const timer = setTimeout(() => controller.abort(), 25000);
    setIsLoading(true);
    setDetectionResult(null);
    try {
      const response = await fetch("/api/detect", { method: "POST", body: image, signal: controller.signal });
      if (!response.ok) throw new Error("Inference unavailable");
      const result = await response.json();
      if (!Array.isArray(result.predictions) || !result.predictions.every((p: Record<string, unknown>) =>
        p && typeof p.class === "string" && ["x", "y", "width", "height", "confidence"].every(k => Number.isFinite(p[k])) &&
        Number(p.width) > 0 && Number(p.height) > 0 && Number(p.confidence) >= 0 && Number(p.confidence) <= 1)) {
        throw new Error("Invalid predictions");
      }
      if (revision.current === id) setDetectionResult(result);
    } catch {
      if (revision.current === id) toast({ title: "Inference unavailable", description: "Check the local inference server and try again.", variant: "destructive" });
    } finally {
      clearTimeout(timer);
      if (revision.current === id) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 pt-20 pb-32">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-up">
          <div className="inline-block p-4 bg-purple-500/10 rounded-full mb-4">
            <Flame className="w-12 h-12 text-purple-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white max-w-4xl mx-auto leading-tight">
            Intelligent Fire Detection System
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Explore hosted fire predictions on a single image. Running an analysis sends the selected image to Roboflow.
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-12 mx-auto max-w-2xl">
          {/* Upload Card */}
          <Card className="p-6 md:p-8 bg-white/5 backdrop-blur-lg border-slate-700 transition-transform hover:scale-[1.02]">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/50"
                >
                  <ImagePreview 
                    preview={preview} 
                    predictions={detectionResult?.predictions} 
                  />
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <div className="flex gap-4 flex-col sm:flex-row">
                <Button
                  onClick={handleSubmit}
                  disabled={!image || isLoading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Analyze Image
                    </>
                  )}
                </Button>
                {(preview || detectionResult) && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Upload Another Image
                  </Button>
                )}
              </div>

              <DetectionResults predictions={detectionResult?.predictions} />
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Index;
