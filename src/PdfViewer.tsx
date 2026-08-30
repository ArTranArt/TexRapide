import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ZoomIn, ZoomOut, AlertCircle, RefreshCw, PanelRight, PanelBottom, PanelLeft, PanelTop, LayoutTemplate, Download, FileText, X, Eye } from "lucide-react";

interface Shortcut {
  key: string;
  code: string;
}

interface PdfViewerProps {
  pdfSrc: string; // The URL/converted file path of the PDF
  pdfPath: string; // The absolute path of the PDF on the disk
  projectName: string;
  onLineSelect: (file: string, line: number) => void;
  compileStatus: string;
  zoomInKey?: Shortcut | null;
  zoomOutKey?: Shortcut | null;
  pdfPosition?: "right" | "bottom" | "left" | "top";
  onChangePdfPosition?: (pos: "right" | "bottom" | "left" | "top") => void;
  forwardSearchRipple?: { page: number; x: number; y: number; timestamp: number } | null;
}

export function PdfViewer({ 
  pdfSrc, 
  pdfPath, 
  projectName, 
  onLineSelect, 
  compileStatus,
  zoomInKey = null,
  zoomOutKey = null,
  pdfPosition = "right",
  onChangePdfPosition,
  forwardSearchRipple = null
}: PdfViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const [pdfFilter, setPdfFilter] = useState<string>(() => {
    return localStorage.getItem("texrapide_pdf_filter") || "normal";
  });
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("texrapide_pdf_filter", pdfFilter);
  }, [pdfFilter]);

  // States for download animations
  const [toast, setToast] = useState<{ filename: string; destPath: string; isClosing: boolean } | null>(null);
  const [toastProgress, setToastProgress] = useState<number>(100);

  const handleDownloadPdf = async () => {
    if (!pdfPath) return;
    setIsDownloading(true);

    try {
      const safeProjectName = projectName ? projectName.replace(/[^a-zA-Z0-9_\-]/g, "_") : "document";
      let filename = `${safeProjectName}.pdf`;
      if (pdfPath) {
        const lastPart = pdfPath.split(/[/\\]/).pop();
        if (lastPart && lastPart.endsWith('.pdf')) {
          filename = lastPart;
        }
      }

      const destPath = await invoke<string>("export_pdf_to_downloads", {
        pdfPath,
        filename,
      });

      // Show toast immediately on success
      setToastProgress(100);
      setToast({
        filename,
        destPath,
        isClosing: false,
      });

    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert(`Erreur lors du téléchargement : ${err}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenDownloadedFile = async () => {
    if (!toast) return;
    try {
      await invoke("show_in_finder", { path: toast.destPath });
    } catch (err) {
      console.error("Failed to open file in Finder:", err);
      alert(`Impossible d'ouvrir le fichier : ${err}`);
    }
  };

  const handleCloseToast = () => {
    setToast(prev => prev ? { ...prev, isClosing: true } : null);
    setTimeout(() => {
      setToast(null);
    }, 400);
  };

  // Countdown timer for toast
  useEffect(() => {
    if (!toast || toast.isClosing) return;

    let current = 100;
    const interval = setInterval(() => {
      current -= 2; // Decays over ~2.5 seconds (50 ticks of 50ms)
      setToastProgress(current);
      if (current <= 0) {
        clearInterval(interval);
        handleCloseToast();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast]);

  // Resize and Fit-to-Width states
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(true);
  const [pageOriginalWidth, setPageOriginalWidth] = useState<number>(595);

  // Page navigation states
  const [showPageNav, setShowPageNav] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<number>(1);

  // Load PDF when pdfSrc or compileStatus changes (compilation success triggers reload)
  useEffect(() => {
    if (!pdfSrc) return;
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
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
        if (loadedPdf.numPages > 0) {
          loadedPdf.getPage(1).then((page: any) => {
            const vp = page.getViewport({ scale: 1.0 });
            setPageOriginalWidth(vp.width || 595);
          });
        }
        hasLoadedRef.current = true;
        setLoading(false);
      },
      (err: any) => {
        console.error("Error loading PDF:", err);
        setError("Impossible d'ouvrir le fichier PDF. Lancez la compilation.");
        setLoading(false);
      }
    );
  }, [pdfSrc, compileStatus]);

  // Track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerWidth(container.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Update scale when container width or page original width changes in Fit-to-Width mode
  useEffect(() => {
    if (isFitWidth && containerWidth > 20 && pageOriginalWidth > 0) {
      const calculatedScale = (containerWidth - 20) / pageOriginalWidth;
      const clampedScale = Math.max(0.1, Math.min(5.0, calculatedScale));
      // Round scale to avoid rendering jitter
      setScale(Math.round(clampedScale * 100) / 100);
    }
  }, [isFitWidth, containerWidth, pageOriginalWidth]);

  // Listen to scroll to track the active page closest to the top
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdf || numPages === 0) return;

    const handleScroll = () => {
      const children = container.children;
      let closestPage = 1;
      let minDistance = Infinity;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (child.id && child.id.startsWith("pdf-page-")) {
          const rect = child.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const distance = Math.abs(rect.top - containerRect.top);
          if (distance < minDistance) {
            minDistance = distance;
            closestPage = parseInt(child.id.replace("pdf-page-", ""), 10);
          }
        }
      }
      setActivePage(closestPage);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [pdf, numPages]);

  // Handle forward search scrolling (Editor -> PDF)
  useEffect(() => {
    if (!forwardSearchRipple) return;

    const pageElement = document.getElementById(`pdf-page-${forwardSearchRipple.page}`);
    const container = containerRef.current;
    if (pageElement && container) {
      const pageRect = pageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const targetY = forwardSearchRipple.y * scale;
      const targetX = forwardSearchRipple.x * scale;

      const scrollY = container.scrollTop + pageRect.top - containerRect.top + targetY;
      const scrollX = container.scrollLeft + pageRect.left - containerRect.left + targetX - (containerRect.width / 2);

      container.scrollTo({ 
        top: Math.max(0, scrollY - 100), 
        left: Math.max(0, scrollX), 
        behavior: "smooth" 
      });
    }
  }, [forwardSearchRipple, scale]);

  // Listen to global Cmd + and Cmd - keys to zoom the PDF
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const isHoveringPdf = document.getElementById("integrated-pdf-viewer")?.matches(":hover");
        if (isHoveringPdf) {
          const isZoomInMatch = zoomInKey
            ? (e.code === zoomInKey.code || e.code === "NumpadAdd")
            : (e.key === "+" || e.key === "=" || e.code === "NumpadAdd");

          const isZoomOutMatch = zoomOutKey
            ? (e.code === zoomOutKey.code || e.code === "NumpadSubtract")
            : (e.key === "-" || e.code === "NumpadSubtract");

          if (isZoomInMatch) {
            e.preventDefault();
            e.stopPropagation();
            setIsFitWidth(false);
            setScale(s => Math.min(5.0, Math.round((s + 0.1) * 10) / 10));
          } else if (isZoomOutMatch) {
            e.preventDefault();
            e.stopPropagation();
            setIsFitWidth(false);
            setScale(s => Math.max(0.2, Math.round((s - 0.1) * 10) / 10));
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [zoomInKey, zoomOutKey]);

  return (
    <div id="integrated-pdf-viewer" className="flex flex-col h-full w-full bg-bg-deep select-none relative overflow-hidden">
      {/* Floating Web-app style Download Toast */}
      {toast && (
        <div 
          className={`absolute top-12 right-4 z-50 bg-bg-card/90 backdrop-blur-xl border border-border-input/40 rounded-xl p-3.5 shadow-2xl flex items-center gap-3 w-80 overflow-hidden select-none ${
            toast.isClosing ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-text-main truncate" title={toast.filename}>
              {toast.filename}
            </h4>
            <p className="text-[9px] text-text-muted mt-0.5 font-sans">Ajouté aux Téléchargements</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleOpenDownloadedFile}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition-colors shadow-sm font-sans"
            >
              Ouvrir
            </button>
            <button 
              onClick={handleCloseToast}
              className="p-1 text-text-muted hover:text-text-main hover:bg-bg-input-hover rounded transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          
          {/* Progress bar line at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500/10">
            <div 
              className="h-full bg-blue-500 transition-all ease-linear"
              style={{ 
                width: `${toastProgress}%`,
                transitionDuration: '50ms'
              }}
            />
          </div>
        </div>
      )}
      {/* PDF Controls */}
      <div className="h-10 border-b border-border-subtle bg-bg-sidebar px-4 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-2">
          {onChangePdfPosition && (
            <div className="relative group">
              <button
                className="w-6 h-6 flex items-center justify-center rounded border bg-bg-input/30 hover:bg-bg-input-hover border-border-subtle text-text-muted hover:text-text-main transition-colors cursor-pointer"
                title="Disposition"
              >
                <LayoutTemplate size={12} />
              </button>
              <div className="absolute left-0 top-full mt-1 p-1 bg-bg-sidebar border border-border-subtle rounded-lg shadow-xl shadow-black/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex gap-1 z-50">
                <button onClick={() => onChangePdfPosition("right")} className={`p-1.5 rounded-md hover:bg-bg-input-hover ${pdfPosition === "right" ? "bg-bg-input text-blue-400" : "text-text-subtle hover:text-text-main"}`} title="PDF à droite"><PanelRight size={14} /></button>
                <button onClick={() => onChangePdfPosition("bottom")} className={`p-1.5 rounded-md hover:bg-bg-input-hover ${pdfPosition === "bottom" ? "bg-bg-input text-blue-400" : "text-text-subtle hover:text-text-main"}`} title="PDF en bas"><PanelBottom size={14} /></button>
                <button onClick={() => onChangePdfPosition("left")} className={`p-1.5 rounded-md hover:bg-bg-input-hover ${pdfPosition === "left" ? "bg-bg-input text-blue-400" : "text-text-subtle hover:text-text-main"}`} title="PDF à gauche"><PanelLeft size={14} /></button>
                <button onClick={() => onChangePdfPosition("top")} className={`p-1.5 rounded-md hover:bg-bg-input-hover ${pdfPosition === "top" ? "bg-bg-input text-blue-400" : "text-text-subtle hover:text-text-main"}`} title="PDF en haut"><PanelTop size={14} /></button>
              </div>
            </div>
          )}
          {compileStatus === "compiling" && (
            <RefreshCw size={10} className="animate-spin text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFitWidth(true)}
            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer border ${
              isFitWidth 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                : "border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-input-hover"
            }`}
            title="Ajuster la largeur automatiquement"
          >
            Ajuster
          </button>
          <button
            onClick={() => {
              setIsFitWidth(false);
              setScale(s => Math.max(0.1, s - 0.1));
            }}
            className="p-1 rounded hover:bg-bg-input-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Zoom arrière"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => {
              setIsFitWidth(false);
              setScale(1.0);
            }}
            className="text-[10px] font-mono text-text-muted hover:text-text-main min-w-[36px] text-center cursor-pointer hover:bg-bg-input-hover p-1 rounded transition-colors"
            title="Réinitialiser le zoom à 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => {
              setIsFitWidth(false);
              setScale(s => Math.min(5.0, s + 0.1));
            }}
            className="p-1 rounded hover:bg-bg-input-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Zoom avant"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => {
              setShowFilterMenu(prev => !prev);
              setShowPageNav(false);
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              showFilterMenu 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm" 
                : "text-text-muted hover:text-text-main hover:bg-bg-input-hover border border-transparent"
            }`}
            title="Filtres de lecture (Mode Sombre, Sépia...)"
          >
            <Eye size={14} />
          </button>

          <div className="w-[1px] h-4 bg-border-subtle mx-1" />

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="p-1 rounded transition-colors cursor-pointer text-text-muted hover:text-text-main hover:bg-bg-input-hover border border-transparent disabled:opacity-35 disabled:cursor-not-allowed"
            title="Télécharger le PDF dans votre dossier Téléchargements"
          >
            <Download size={14} className={isDownloading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => {
              setShowPageNav(prev => !prev);
              setShowFilterMenu(false);
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              showPageNav 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm" 
                : "text-text-muted hover:text-text-main hover:bg-bg-input-hover border border-transparent"
            }`}
            title="Afficher la navigation par pages"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-2 flex flex-col items-start gap-4 scroll-smooth bg-bg-deep"
      >
        {loading && (
          <div className="flex-1 w-full flex flex-col items-center justify-center text-text-subtle">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Chargement du PDF...</span>
          </div>
        )}

        {error && (
          <div className="flex-1 w-full flex flex-col items-center justify-center text-text-subtle gap-2">
            <AlertCircle size={24} className="text-text-extra-subtle" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {!loading && !error && pdf && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
          <div key={pageNumber} id={`pdf-page-${pageNumber}`} className="mx-auto shrink-0">
            <PdfPage
              pdf={pdf}
              pageNumber={pageNumber}
              scale={scale}
              pdfPath={pdfPath}
              onLineSelect={onLineSelect}
              pdfFilter={pdfFilter}
              forwardSearchRipple={
                forwardSearchRipple?.page === pageNumber 
                  ? { x: forwardSearchRipple.x, y: forwardSearchRipple.y, timestamp: forwardSearchRipple.timestamp } 
                  : null
              }
            />
          </div>
        ))}
      </div>

      {/* Floating Filter Menu Panel */}
      {showFilterMenu && (
        <div className="absolute top-12 right-3 w-48 bg-bg-sidebar/90 backdrop-blur-md border border-border-subtle rounded-xl shadow-2xl flex flex-col p-2.5 z-30 animate-fade-in gap-1.5 select-none">
          <span className="text-[9px] font-bold text-text-subtle uppercase tracking-wider mb-1 block px-1 text-center border-b border-border-subtle/50 pb-1">
            Filtres de Lecture
          </span>
          {[
            { id: "normal", name: "Normal", color: "bg-white border-gray-300" },
            { id: "dark", name: "Mode Sombre", color: "bg-[#18181c] border-gray-700" },
            { id: "sepia", name: "Sépia / Papier", color: "bg-[#f4ecd8] border-[#dfd2be]" },
            { id: "warm", name: "Confort des Yeux", color: "bg-[#fdf3e7] border-[#ecd8bf]" },
            { id: "grayscale", name: "Noir & Blanc", color: "bg-gradient-to-r from-black via-gray-500 to-white border-gray-400" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setPdfFilter(f.id);
                setShowFilterMenu(false);
              }}
              className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-2.5 ${
                pdfFilter === f.id
                  ? "bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30"
                  : "text-text-muted hover:text-text-main hover:bg-bg-input-hover border border-transparent"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${f.color}`} />
              <span className="truncate">{f.name}</span>
              {pdfFilter === f.id && (
                <div className="ml-auto w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Floating Page Navigation Panel */}
      {showPageNav && numPages > 0 && (
        <div className="absolute top-12 right-3 bottom-3 w-28 bg-bg-sidebar/80 backdrop-blur-md border border-border-subtle rounded-md shadow-2xl flex flex-col p-2 z-30 overflow-y-auto animate-fade-in gap-1">
          <span className="text-[9px] font-bold text-text-subtle uppercase tracking-wider mb-1 block px-1 text-center border-b border-border-subtle/50 pb-1">
            Pages
          </span>
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => {
                setActivePage(pageNumber);
                const element = document.getElementById(`pdf-page-${pageNumber}`);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className={`w-full py-1 px-2 rounded text-[11px] font-mono transition-all cursor-pointer flex items-center justify-between ${
                activePage === pageNumber
                  ? "bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30"
                  : "text-text-muted hover:text-text-main hover:bg-bg-input-hover border border-transparent"
              }`}
            >
              <span>Page {pageNumber}</span>
              {activePage === pageNumber && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PdfPageProps {
  pdf: any;
  pageNumber: number;
  scale: number;
  pdfPath: string;
  onLineSelect: (file: string, line: number) => void;
  pdfFilter: string;
  forwardSearchRipple: { x: number; y: number; timestamp: number } | null;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  status: "searching" | "success" | "error";
}

function PdfPage({ pdf, pageNumber, scale, pdfPath, onLineSelect, pdfFilter, forwardSearchRipple }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    pdf.getPage(pageNumber).then((page: any) => {
      // Use devicePixelRatio for Retina/High-DPI sharp rendering
      const dpr = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale * dpr });
      setViewport(vp);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      // Set internal drawing canvas dimensions to scaled up values
      canvas.width = vp.width;
      canvas.height = vp.height;
      
      // Constraint CSS layout display dimensions to standard scale values
      canvas.style.width = `${vp.width / dpr}px`;
      canvas.style.height = `${vp.height / dpr}px`;

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

  useEffect(() => {
    if (!forwardSearchRipple) return;
    
    const pixelX = forwardSearchRipple.x * scale;
    const pixelY = forwardSearchRipple.y * scale;

    const rippleId = forwardSearchRipple.timestamp;
    const newRipple: Ripple = { id: rippleId, x: pixelX, y: pixelY, status: "success" };
    setRipples(prev => [...prev, newRipple]);

    const timeout = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [forwardSearchRipple, scale]);

  const handleDoubleClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Clear selection on mouseup to prevent trailing selections across screen after focus jump
    const clearSelection = () => {
      window.getSelection()?.removeAllRanges();
      window.removeEventListener("mouseup", clearSelection);
    };
    window.addEventListener("mouseup", clearSelection);

    if (!canvasRef.current || !viewport) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Create a new ripple
    const rippleId = Date.now();
    const newRipple: Ripple = { id: rippleId, x, y, status: "searching" };
    setRipples(prev => [...prev, newRipple]);

    // Convert mouse click relative coordinates to internal canvas/viewport coordinate space
    const viewportX = x * (viewport.width / rect.width);
    const viewportY = y * (viewport.height / rect.height);

    // Convert viewport coordinates to PDF 72 dpi big points relative to top-left corner
    const pdfX = viewportX / viewport.scale;
    const pdfY = viewportY / viewport.scale;

    try {
      // Invoke Tauri command to perform inverse search
      const result: { file: string; line: number } = await invoke("synctex_inverse_search", {
        pdfPath,
        page: pageNumber,
        x: pdfX,
        y: pdfY,
      });

      // Update ripple to success
      setRipples(prev => prev.map(r => r.id === rippleId ? { ...r, status: "success" } : r));

      onLineSelect(result.file, result.line);
    } catch (err) {
      console.warn("SyncTeX inverse search failed:", err);
      // Update ripple to error
      setRipples(prev => prev.map(r => r.id === rippleId ? { ...r, status: "error" } : r));
    } finally {
      // Clean up ripple after its animation is done
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 1000);
    }
  };

  const getFilterStyle = (filter: string) => {
    switch (filter) {
      case "dark":
        return "invert(0.93) hue-rotate(180deg) brightness(0.95) contrast(1.1)";
      case "sepia":
        return "sepia(0.6) contrast(0.95) brightness(0.95)";
      case "warm":
        return "sepia(0.3) saturate(1.2) hue-rotate(-5deg) brightness(0.97)";
      case "grayscale":
        return "grayscale(1) contrast(1.05)";
      default:
        return "none";
    }
  };

  return (
    <div 
      className="relative shadow-xl border border-border-subtle bg-white rounded-sm select-none group shrink-0 mx-auto transition-all duration-300"
      style={{ filter: getFilterStyle(pdfFilter) }}
    >
      <canvas 
        ref={canvasRef} 
        onDoubleClick={handleDoubleClick}
        className="cursor-crosshair block hover:brightness-[0.98] transition-all" 
        title="Double-cliquez pour aller à la ligne correspondante dans le code"
      />
      
      {/* Click ripples for visual feedback */}
      {ripples.map(r => (
        <div
          key={r.id}
          style={{ left: r.x, top: r.y }}
          className={`absolute pointer-events-none z-20 w-8 h-8 rounded-full border-2 ${
            r.status === "searching" 
              ? "animate-ripple-blue" 
              : r.status === "success" 
                ? "animate-ripple-green" 
                : "animate-ripple-red"
          }`}
        />
      ))}

      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/40 text-white text-[9px] font-mono select-none opacity-0 group-hover:opacity-100 transition-opacity">
        Page {pageNumber}
      </div>
    </div>
  );
}
