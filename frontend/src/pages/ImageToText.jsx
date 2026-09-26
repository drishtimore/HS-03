import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Upload,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Loader2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ImageToText() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [activeBoxIndex, setActiveBoxIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  // If navigated from Home with a preloaded file
  useEffect(() => {
    if (location.state?.preloadedFile) {
      handleFileSelected(location.state.preloadedFile);
    }
  }, [location.state]);

  const handleFileSelected = (file) => {
    if (!file) return;
    setImageFile(file);
    setErrorMsg('');
    setSavedDocId(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Run OCR extraction automatically
    performOcr(file);
  };

  const performOcr = async (file) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.ocr.imageToText(file);
      setOcrResult(res);
      if (res.saved_document_id) {
        setSavedDocId(res.saved_document_id);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || 'Failed to extract text from image');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(file);
    } else {
      setErrorMsg('Please drop a valid image file (PNG, JPG, WEBP, TIFF, BMP).');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCopy = () => {
    if (!ocrResult?.text) return;
    navigator.clipboard.writeText(ocrResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!ocrResult?.text) return;
    const blob = new Blob([ocrResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageFile?.name?.split('.')[0] || 'extracted'}_ocr.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!ocrResult) return;
    const blob = new Blob([JSON.stringify(ocrResult, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageFile?.name?.split('.')[0] || 'ocr'}_coordinates.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToWorkspace = async () => {
    if (!imageFile || !activeWorkspace?.id) return;
    setSavingToLibrary(true);
    try {
      const res = await api.ocr.imageToText(imageFile, activeWorkspace.id);
      if (res.saved_document_id) {
        setSavedDocId(res.saved_document_id);
      }
    } catch (err) {
      console.error('Save to library error:', err);
      setErrorMsg(`Failed to save to workspace: ${err.message}`);
    } finally {
      setSavingToLibrary(false);
    }
  };

  // Helper for confidence badge colors
  const getConfColor = (conf) => {
    if (conf >= 0.85) return 'var(--color-quelle-green)';
    if (conf >= 0.6) return 'var(--color-quelle-yellow)';
    return 'var(--color-quelle-pink)';
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* ═══════ HEADER ═══════ */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="p-1.5 rounded"
              style={{
                background: 'var(--color-quelle-orange)',
                border: '2px solid var(--color-quelle-ink)',
                boxShadow: 'var(--shadow-brutal-xs)',
              }}
            >
              <ScanLine size={18} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Deep Learning Vision Suite
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-quelle-ink)' }}
          >
            Image-to-Text OCR Workbench
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-quelle-ink-muted)' }}>
            Extract high-fidelity text from photos, scans, and documents with RapidOCR deep learning and verified bounding box coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-brutal btn-brutal-primary flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span>Upload New Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
            accept=".png,.jpg,.jpeg,.webp,.tiff,.bmp"
            className="hidden"
          />
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div
          className="p-4 mb-6 rounded-lg border-2 border-black flex items-center gap-3 animate-fade-in"
          style={{ background: 'var(--color-quelle-pink)', color: 'var(--color-quelle-ink)' }}
        >
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-xs font-bold">{errorMsg}</span>
        </div>
      )}

      {/* ═══════ UPLOAD DROPZONE (WHEN NO IMAGE SELECTED) ═══════ */}
      {!imagePreview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-3 border-dashed border-black rounded-xl p-12 text-center cursor-pointer transition-all hover:bg-amber-50/50 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] my-8"
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
            style={{ background: 'var(--color-quelle-yellow)' }}
          >
            <ImageIcon size={30} strokeWidth={2.5} />
          </div>

          <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Drag & Drop an image here, or click to browse
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Supports PNG, JPG, JPEG, WEBP, TIFF, and BMP images. Automatically deskews, denoises, and executes deep-learning optical recognition.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 border border-gray-300">
              ✓ RapidOCR Deep Learning
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 border border-gray-300">
              ✓ Sub-pixel Bounding Boxes
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 border border-gray-300">
              ✓ Token Confidence Scoring
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 border border-gray-300">
              ✓ Zero Hallucination Gating
            </span>
          </div>
        </div>
      )}

      {/* ═══════ WORKBENCH (IMAGE LOADED) ═══════ */}
      {imagePreview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN: Image & Bounding Box Inspector (7 cols) ── */}
          <div
            className="lg:col-span-7 rounded-xl border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col"
          >
            {/* Visual Top Controls */}
            <div
              className="p-3 border-b-2 border-black flex items-center justify-between"
              style={{ background: 'var(--color-quelle-cream)' }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-bold truncate">{imageFile?.name || 'Image Preview'}</span>
                {ocrResult?.width && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-black">
                    {ocrResult.width}×{ocrResult.height}px
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-white hover:bg-gray-100 border border-black flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {showBoundingBoxes ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showBoundingBoxes ? 'Hide Overlays' : 'Show Overlays'}</span>
                </button>
              </div>
            </div>

            {/* Image Canvas with Overlay Boxes */}
            <div className="p-4 bg-gray-100 flex items-center justify-center min-h-[420px] relative overflow-hidden">
              {loading ? (
                <div className="text-center py-16">
                  <Loader2 size={36} className="animate-spin mx-auto mb-3 text-black" />
                  <p className="text-xs font-bold">Executing Deep Learning OCR...</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Analyzing pixel tensors, deskewing, and computing polygon vertices
                  </p>
                </div>
              ) : (
                <div className="relative max-w-full inline-block border border-gray-300 bg-white shadow-sm">
                  <img
                    src={imagePreview}
                    alt="OCR Preview"
                    className="max-h-[560px] w-auto object-contain block select-none"
                  />

                  {/* Render Bounding Boxes Overlay */}
                  {showBoundingBoxes && ocrResult?.sections?.map((sec, idx) => {
                    if (!sec.bbox || sec.bbox.length !== 4) return null;
                    const imgW = ocrResult.width || 1;
                    const imgH = ocrResult.height || 1;

                    // Convert to percentages
                    const left = `${(sec.bbox[0] / imgW) * 100}%`;
                    const top = `${(sec.bbox[1] / imgH) * 100}%`;
                    const width = `${((sec.bbox[2] - sec.bbox[0]) / imgW) * 100}%`;
                    const height = `${((sec.bbox[3] - sec.bbox[1]) / imgH) * 100}%`;

                    const isActive = activeBoxIndex === idx;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setActiveBoxIndex(idx)}
                        onMouseLeave={() => setActiveBoxIndex(null)}
                        className={`absolute cursor-pointer transition-all ${
                          isActive
                            ? 'bg-amber-400/40 border-2 border-black z-20 shadow-xs'
                            : 'bg-green-500/15 border border-green-700/80 hover:bg-amber-300/30'
                        }`}
                        style={{
                          left,
                          top,
                          width,
                          height,
                        }}
                        title={`Line ${idx + 1}: "${sec.text}" (${Math.round((sec.ocr_confidence || 0.9) * 100)}%)`}
                      >
                        {isActive && (
                          <div
                            className="absolute -top-6 left-0 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-30"
                          >
                            {Math.round((sec.ocr_confidence || 0.9) * 100)}% Fidelity
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual Overlay Legend */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500/40 border border-green-700" /> High Confidence
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/40 border border-black" /> Hovered Target
                </span>
              </div>
              <span className="font-mono">{ocrResult?.sections?.length || 0} Text Lines Detected</span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Extracted Text & Quality Metrics (5 cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quality Metrics Scorecard */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Fidelity Score
                </div>
                <div className="text-2xl font-black mt-0.5 text-green-700" style={{ fontFamily: 'var(--font-display)' }}>
                  {ocrResult?.confidence_percentage || (ocrResult?.confidence ? `${Math.round(ocrResult.confidence * 100)}%` : '---')}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">RapidOCR Deep Learning</div>
              </div>

              <div className="p-3 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Extracted Tokens
                </div>
                <div className="text-2xl font-black mt-0.5 text-black" style={{ fontFamily: 'var(--font-display)' }}>
                  {ocrResult?.words_count ?? '0'}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">{ocrResult?.lines_count ?? 0} lines identified</div>
              </div>
            </div>

            {/* Extracted Text Viewer Card */}
            <div
              className="rounded-xl border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              <div
                className="p-3 border-b-2 border-black flex items-center justify-between"
                style={{ background: 'var(--color-quelle-cream)' }}
              >
                <div className="flex items-center gap-1.5">
                  <FileText size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Extracted Text Content</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    disabled={!ocrResult?.text}
                    className="px-2 py-1 text-xs font-bold rounded bg-white hover:bg-gray-100 border border-black flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    disabled={!ocrResult?.text}
                    className="px-2 py-1 text-xs font-bold rounded bg-white hover:bg-gray-100 border border-black flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download size={12} />
                    <span>TXT</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    disabled={!ocrResult}
                    className="px-2 py-1 text-xs font-bold rounded bg-white hover:bg-gray-100 border border-black flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download size={12} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Text content area */}
              <div className="p-4 max-h-[340px] overflow-y-auto font-sans text-xs leading-relaxed text-gray-800 space-y-2 bg-white">
                {loading ? (
                  <div className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-black" />
                    <span>Processing image tokens...</span>
                  </div>
                ) : ocrResult?.text ? (
                  ocrResult.sections?.length > 0 ? (
                    ocrResult.sections.map((sec, i) => (
                      <div
                        key={i}
                        onMouseEnter={() => setActiveBoxIndex(i)}
                        onMouseLeave={() => setActiveBoxIndex(null)}
                        className={`p-1.5 rounded transition-colors ${
                          activeBoxIndex === i ? 'bg-amber-100 border border-black' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{sec.text}</p>
                      </div>
                    ))
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs">{ocrResult.text}</pre>
                  )
                ) : (
                  <p className="text-gray-400 italic py-8 text-center">
                    No text detected in this image. Try uploading a clearer scan or photo.
                  </p>
                )}
              </div>
            </div>

            {/* Ingestion & Action Card */}
            <div
              className="p-4 rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <BookOpen size={14} /> Workspace Ingestion & Search
              </h4>

              {savedDocId ? (
                <div className="p-3 rounded bg-green-50 border border-green-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-800">
                    <CheckCircle2 size={14} /> Saved into Workspace Library!
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/viewer/${savedDocId}`}
                      className="px-2.5 py-1 text-xs font-bold rounded bg-black text-white hover:bg-gray-800 no-underline inline-flex items-center gap-1"
                    >
                      Inspect in Viewer <ArrowRight size={11} />
                    </Link>
                    <Link
                      to="/chat"
                      className="px-2.5 py-1 text-xs font-bold rounded bg-white hover:bg-gray-100 border border-black text-black no-underline inline-flex items-center gap-1"
                    >
                      Chat with this Scan
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSaveToWorkspace}
                  disabled={savingToLibrary || !ocrResult}
                  className="btn-brutal btn-brutal-sm w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--color-quelle-yellow)' }}
                >
                  {savingToLibrary ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Ingesting to Library...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={14} strokeWidth={2.5} />
                      <span>Save Scan to Workspace Library</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[10px] text-gray-500">
                Saving to library adds this document to your RAG vector index for grounded citation search and question answering.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
