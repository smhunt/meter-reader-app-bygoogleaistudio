import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Check, RefreshCw, Zap, ZapOff, Loader2, Image as ImageIcon, ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import { analyzeMeterImage, AnalysisResult } from '../services/geminiService';
import { MeterReading } from '../types';

interface CameraScannerProps {
  onScanComplete: (reading: MeterReading) => void;
  onCancel: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScanComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Image States
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("Locating...");

  // Initialize Location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        },
        (err) => {
          console.warn("Location access denied or failed:", err);
          setLocation("Location unavailable");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocation("No GPS support");
    }
  }, []);

  // Initialize Camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      // If we have an image, don't start camera
      if (originalImage) return;

      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn("Video play failed:", playError);
          }
        }

        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        // @ts-ignore
        if (capabilities.torch) {
          setHasFlash(true);
        }

      } catch (err) {
        console.error("Camera access error:", err);
        if (isMounted) {
          setError("Could not access camera. Please verify permissions or upload a photo.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [originalImage]);

  // Toggle Flash
  const toggleFlash = useCallback(() => {
    if (stream && hasFlash) {
      const track = stream.getVideoTracks()[0];
      const newMode = !flashOn;
      track.applyConstraints({
        advanced: [{ torch: newMode } as any]
      }).then(() => {
        setFlashOn(newMode);
      }).catch((e: any) => console.log(e));
    }
  }, [stream, hasFlash, flashOn]);

  // Capture Image
  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setOriginalImage(dataUrl);
        processImage(dataUrl);
      }
    }
  }, []);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setOriginalImage(result);
      processImage(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Helper to crop image based on Gemini bounding box
  const generateCrop = async (base64: string, box: { ymin: number, xmin: number, ymax: number, xmax: number }) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = img.width;
        const h = img.height;
        
        // Convert normalized 0-1000 coords to pixels
        const ymin = (box.ymin / 1000) * h;
        const xmin = (box.xmin / 1000) * w;
        const ymax = (box.ymax / 1000) * h;
        const xmax = (box.xmax / 1000) * w;
        
        const boxW = xmax - xmin;
        const boxH = ymax - ymin;
        
        // Add padding 
        // Width: 20% (Confirmed OK by user)
        // Height: 60% (Increased to ensure vertical whitespace/breathing room)
        const padX = boxW * 0.2;
        const padY = boxH * 0.6;
        
        const finalX = Math.max(0, xmin - padX);
        const finalY = Math.max(0, ymin - padY);
        const finalW = Math.min(w - finalX, boxW + (padX * 2));
        const finalH = Math.min(h - finalY, boxH + (padY * 2));
        
        canvas.width = finalW;
        canvas.height = finalH;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          resolve(base64); // Fallback
        }
      };
      img.src = base64;
    });
  };

  // Send to AI
  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const result = await analyzeMeterImage(imageData);
      setAnalysisResult(result);
      
      if (result.boundingBox) {
        const cropped = await generateCrop(imageData, result.boundingBox);
        setCroppedImage(cropped);
        setIsZoomed(true); // Auto zoom on success
      }
    } catch (e) {
      setError("AI Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    setIsZoomed(false);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (analysisResult && originalImage) {
      onScanComplete({
        id: Date.now().toString(),
        value: analysisResult.value,
        confidence: analysisResult.confidence,
        timestamp: Date.now(),
        imageUrl: originalImage, // Save the full context image
        location: location
      });
    }
  };

  const currentDisplayImage = isZoomed && croppedImage ? croppedImage : originalImage;

  return (
    <div className="h-full relative flex flex-col bg-black">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onCancel} className="p-2 bg-slate-800/50 backdrop-blur-sm rounded-full text-white">
          <X size={24} />
        </button>
        {/* Zoom Toggle - Only show if we have a result and a cropped version */}
        {analysisResult && croppedImage && (
           <button 
             onClick={() => setIsZoomed(!isZoomed)} 
             className="p-2 bg-primary/90 backdrop-blur-sm rounded-full text-white shadow-lg transition-transform active:scale-95"
           >
             {isZoomed ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
           </button>
        )}
        {hasFlash && !originalImage && (
          <button onClick={toggleFlash} className="p-2 bg-slate-800/50 backdrop-blur-sm rounded-full text-white">
            {flashOn ? <Zap size={24} className="text-yellow-400 fill-yellow-400" /> : <ZapOff size={24} />}
          </button>
        )}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-900">
        {error ? (
          <div className="text-red-400 text-center p-6 max-w-xs">
            <p className="mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <button onClick={triggerFileUpload} className="bg-primary px-4 py-2 rounded text-white">
                Upload Photo
              </button>
              <button onClick={onCancel} className="bg-surface px-4 py-2 rounded text-white border border-slate-700">
                Go Back
              </button>
            </div>
          </div>
        ) : currentDisplayImage ? (
          <div className="relative w-full h-full">
             <img 
               src={currentDisplayImage} 
               alt="Captured" 
               className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`} 
             />
             {/* Zoom Indicator Label */}
             {isZoomed && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-primary border border-primary/30 backdrop-blur-md pointer-events-none">
                 Zoomed Region
               </div>
             )}
          </div>
        ) : (
          <>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[80%] aspect-video border-2 border-primary/70 rounded-lg relative overflow-hidden bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 w-full bg-primary/20 animate-scan-line h-1"></div>
                <div className="absolute bottom-2 right-2 text-primary/80 text-xs font-mono">AI OCR ACTIVE</div>
              </div>
            </div>
            <div className="absolute bottom-32 w-full text-center text-white/80 text-sm font-medium drop-shadow-md">
              Align meter digits within the box
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls / Result Card */}
      <div className="bg-surface p-6 rounded-t-2xl relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-400 animate-pulse">Analyzing digits & zooming...</p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Detected Reading</p>
              <div className="flex items-center justify-center space-x-2">
                <input 
                  type="text" 
                  value={analysisResult.value}
                  onChange={(e) => setAnalysisResult({...analysisResult, value: e.target.value})}
                  className="bg-slate-900 border border-slate-700 text-3xl font-mono text-center text-white p-2 rounded-lg w-full max-w-[300px] tracking-widest focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="mt-2 flex justify-center items-center space-x-4 text-xs text-slate-500">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-1 ${analysisResult.confidence > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {analysisResult.confidence}% Confidence
                </div>
                <div className="flex items-center text-slate-400">
                  <MapPin size={12} className="mr-1" />
                  {location}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button onClick={handleRetake} className="flex items-center justify-center py-3 px-4 rounded-xl bg-slate-700 text-white font-medium active:scale-95 transition-transform">
                <RefreshCw size={18} className="mr-2" />
                Retake
              </button>
              <button onClick={handleConfirm} className="flex items-center justify-center py-3 px-4 rounded-xl bg-primary text-white font-bold active:scale-95 transition-transform shadow-lg shadow-primary/25">
                <Check size={18} className="mr-2" />
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center px-4 pb-2">
             <button 
               onClick={triggerFileUpload}
               className="flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors"
             >
               <div className="p-3 rounded-full bg-slate-700/50 mb-1">
                 <ImageIcon size={24} />
               </div>
               <span className="text-[10px]">Upload</span>
             </button>

            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform touch-manipulation mx-auto"
              aria-label="Capture"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-inner" />
            </button>
            
            <div className="w-12 opacity-0"></div>
          </div>
        )}
      </div>
    </div>
  );
};