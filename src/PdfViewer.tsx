import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ZoomIn, ZoomOut, AlertCircle, RefreshCw } from "lucide-react";

interface PdfViewerProps {
  pdfSrc: string; // The URL/converted file path of the PDF
  pdfPath: string; // The absolute path of the PDF on the disk
  onLineSelect: (file: string, line: number) => void;
  compileStatus: string;
}

export function PdfViewer({ pdfSrc, pdfPath, onLineSelect, compileStatus }: PdfViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF when pdfSrc or compileStatus changes (compilation success triggers reload)
  useEffect(() => {
    if (!pdfSrc) return;
    setLoading(true);
    setError(null);

    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      setError("La librairie PDF.js n'est pas encore chargée.");
      setLoading(false);
      return;
    }

    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    // Cache busting by adding timestamp query parameter to loading task
    const cacheBuster = pdfSrc.includes("?") ? `&t=${Date.now()}` : `?t=${Date.now()}`;
    const loadingTask = pdfjsLib.getDocument(pdfSrc + cacheBuster);
    
    loadingTask.promise.then(
      (loadedPdf: any) => {
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setLoading(false);
      },
      (err: any) => {
        console.error("Error loading PDF:", err);
        setError("Impossible d'ouvrir le fichier PDF. Lancez la compilation.");
        setLoading(false);
      }
    );
  }, [pdfSrc, compileStatus]);

  return (
    <div className="flex flex-col h-full w-full bg-bg-deep select-none">
      {/* PDF Controls */}
      <div className="h-10 border-b border-border-subtle bg-bg-sidebar px-4 flex items-center justify-between shrink-0 select-none z-10">
        <span className="text-[10px] font-bold text-text-subtle font-display uppercase tracking-wider flex items-center gap-2">
          Lecteur Intégré {numPages > 0 && `· ${numPages} Page${numPages > 1 ? "s" : ""}`}
          {compileStatus === "compiling" && (
            <RefreshCw size={10} className="animate-spin text-blue-500" />
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="p-1 rounded hover:bg-bg-input-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Zoom arrière"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-mono text-text-muted min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3.0, s + 0.1))}
            className="p-1 rounded hover:bg-bg-input-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Zoom avant"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6 scroll-smooth bg-bg-deep"
      >
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-text-subtle">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Chargement du PDF...</span>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center text-text-subtle gap-2">
            <AlertCircle size={24} className="text-text-extra-subtle" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {!loading && !error && pdf && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
          <PdfPage
            key={pageNumber}
            pdf={pdf}
            pageNumber={pageNumber}
            scale={scale}
            pdfPath={pdfPath}
            onLineSelect={onLineSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface PdfPageProps {
  pdf: any;
  pageNumber: number;
  scale: number;
  pdfPath: string;
  onLineSelect: (file: string, line: number) => void;
}

function PdfPage({ pdf, pageNumber, scale, pdfPath, onLineSelect }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    pdf.getPage(pageNumber).then((page: any) => {
      const vp = page.getViewport({ scale });
      setViewport(vp);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = vp.height;
      canvas.width = vp.width;

      // Cancel previous render task if active
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        viewport: vp,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      task.promise.catch((err: any) => {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF render error", err);
        }
      });
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale]);

  const handleDoubleClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !viewport) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert browser coordinates to PDF 72 dpi big points relative to top-left corner
    const pdfX = x / scale;
    const pdfY = y / scale;

    try {
      // Invoke Tauri command to perform inverse search
      const result: { file: string; line: number } = await invoke("synctex_inverse_search", {
        pdfPath,
        page: pageNumber,
        x: pdfX,
        y: pdfY,
      });

      // Call parent callback with selected file (normalize back to relative format if it's absolute)
      let relativeFile = result.file;
      const projectDir = pdfPath.substring(0, pdfPath.lastIndexOf("/"));
      if (relativeFile.startsWith(projectDir)) {
        relativeFile = relativeFile.substring(projectDir.length + 1);
      }

      onLineSelect(relativeFile, result.line);
    } catch (err) {
      console.warn("SyncTeX inverse search failed:", err);
    }
  };

  return (
    <div className="relative shadow-xl border border-border-subtle bg-white rounded-sm select-none group">
      <canvas 
        ref={canvasRef} 
        onDoubleClick={handleDoubleClick}
        className="cursor-crosshair max-w-full block hover:brightness-[0.98] transition-all" 
        title="Double-cliquez pour aller à la ligne correspondante dans le code"
      />
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/40 text-white text-[9px] font-mono select-none opacity-0 group-hover:opacity-100 transition-opacity">
        Page {pageNumber}
      </div>
    </div>
  );
}
