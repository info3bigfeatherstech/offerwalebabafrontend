// PRODUCT_MODAL_SEGMENT/BulkUploadModal.jsx
//
// FEATURES:
//  • Drag & drop or click-to-browse CSV upload
//  • Browser-side CSV preview table (parsed before upload)
//  • Column validation badges — shows which required/optional cols detected
//  • Download sample CSV template button
//  • Upload progress bar (0→100% file transfer)
//  • "Processing on server…" spinner after upload hits 100%
//  • Results panel: inserted count, failed count, failed rows table
//  • On success → calls onSuccess() so parent re-fetches products

import React, { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  importProductsCSV,
  resetBulkUpload,
  setUploadPct,
} from "../ADMIN_REDUX_MANAGEMENT/bulkUploadSlice";

// ─────────────────────────────────────────────────────────────────────────────
// Sample CSV template
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_CSV = `name,title,description,category,brand,status,isfeatured,barcode,basePrice,salePrice,quantity,variantAttributes,productAttributes,images,soldEnabled,soldCount,fomoEnabled,fomoType,viewingNow,productLeft,customMessage,weight,length,width,height
Sony WH-1000XM5,Sony WH-1000XM5 Headphones,Industry leading noise cancellation,Electronics,Sony,active,false,1234567890,29999,24999,50,Color:Black|Size:One Size,Wireless:Yes|Driver:40mm,,false,0,false,viewing_now,0,0,,0.25,20,18,8
Sony WH-1000XM5,Sony WH-1000XM5 Headphones,Industry leading noise cancellation,Electronics,Sony,active,false,1234567891,29999,24999,30,Color:Silver|Size:One Size,,,false,0,false,viewing_now,0,0,,0.25,20,18,8
Nike Air Max 270,Nike Air Max 270 Running Shoes,Lightweight running shoes,Footwear,Nike,active,true,9876543210,8999,7499,100,Size:8|Color:White,Material:Mesh|Sole:Rubber,,true,245,true,product_left,0,15,,0.8,32,22,14`;

const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "bulk_upload_template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// Parse CSV text → array of row objects
// ─────────────────────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
};

const REQUIRED_COLS  = ["name", "category", "basePrice"];
const IMPORTANT_COLS = ["title", "brand", "status", "barcode", "salePrice", "quantity", "variantAttributes", "images"];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const BulkUploadModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { uploading, uploadPct, processing, result, error } =
    useSelector((s) => s.adminBulkUpload);

  const fileInputRef             = useRef(null);
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState([]);
  const [headers,    setHeaders]    = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [localPct,   setLocalPct]   = useState(0);
  const [resultTab,  setResultTab]  = useState("success");

  const reset = () => {
    dispatch(resetBulkUpload());
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setParseError(null);
    setLocalPct(0);
    setResultTab("success");
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are supported.");
      return;
    }
    dispatch(resetBulkUpload());
    setParseError(null);
    setLocalPct(0);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (!rows.length) { setParseError("CSV appears to be empty."); return; }
        setHeaders(Object.keys(rows[0]));
        setPreview(rows);
      } catch (err) {
        setParseError("Could not parse CSV: " + err.message);
      }
    };
    reader.readAsText(f);
  }, [dispatch]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const res = await dispatch(
      importProductsCSV({
        file,
        onProgress: (pct) => {
          setLocalPct(pct);
          dispatch(setUploadPct(pct));
        },
      })
    );
    if (importProductsCSV.fulfilled.match(res)) {
      onSuccess?.();
    }
  };

  const missingCols = REQUIRED_COLS.filter((c) => !headers.includes(c));
  const canUpload   = file && !parseError && missingCols.length === 0 && !uploading && !result;
  const isActive    = uploading || processing;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-8 shadow-2xl flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Upload Products</h2>
              <p className="text-sm text-gray-500">Import multiple products at once via CSV file</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </button>
            <button onClick={() => { reset(); onClose(); }} disabled={isActive}
              className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-40 transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── RESULT PANEL ──────────────────────────────────────────────── */}
          {result && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{result.totalRows}</p>
                  <p className="text-sm text-blue-600 mt-1">Total Rows</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{result.insertedProducts}</p>
                  <p className="text-sm text-green-600 mt-1">Products Created</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${result.failedCount > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-3xl font-bold ${result.failedCount > 0 ? "text-red-700" : "text-gray-400"}`}>{result.failedCount}</p>
                  <p className={`text-sm mt-1 ${result.failedCount > 0 ? "text-red-600" : "text-gray-400"}`}>Failed Rows</p>
                </div>
              </div>

              {result.failedCount > 0 ? (
                <div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setResultTab("success")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${resultTab === "success" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      ✅ Succeeded ({result.insertedProducts})
                    </button>
                    <button onClick={() => setResultTab("failed")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${resultTab === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      ❌ Failed ({result.failedCount})
                    </button>
                  </div>

                  {resultTab === "failed" && (
                    <div className="border border-red-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-red-700 w-10">#</th>
                            <th className="px-4 py-3 text-left font-medium text-red-700">Product</th>
                            <th className="px-4 py-3 text-left font-medium text-red-700">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {result.failed.map((f, i) => (
                            <tr key={i} className="hover:bg-red-50">
                              <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-gray-800">{f.product}</td>
                              <td className="px-4 py-2.5 text-red-600">{f.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {resultTab === "success" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-green-700 text-sm font-medium">
                        🎉 {result.insertedProducts} product{result.insertedProducts !== 1 ? "s" : ""} successfully imported and are now visible in your product list.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 text-sm font-medium">
                    🎉 All {result.insertedProducts} product{result.insertedProducts !== 1 ? "s" : ""} imported successfully! Head back to your product list to see them.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Upload Another File
                </button>
                <button onClick={() => { reset(); onClose(); }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── PROGRESS ──────────────────────────────────────────────────── */}
          {(uploading || processing) && !result && (
            <div className="space-y-5">
              <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl text-center">
                <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                <p className="font-bold text-indigo-800 text-xl">
                  {processing ? "Processing on server…" : `Uploading file — ${localPct}%`}
                </p>
                <p className="text-indigo-600 text-sm mt-2 max-w-sm mx-auto">
                  {processing
                    ? "Server is creating products, uploading images from URLs and saving everything to the database. This may take a minute for large files."
                    : "Sending your CSV to the server…"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>{processing ? "Server processing…" : "Uploading…"}</span>
                  <span className="text-indigo-600">{processing ? "100% ✓" : `${localPct}%`}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{
                      width:      `${processing ? 100 : localPct}%`,
                      background: "linear-gradient(90deg, #6366f1, #a855f7)",
                    }}
                  />
                </div>
                {processing && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {[0, 0.15, 0.30].map((delay, i) => (
                      <span key={i}
                        className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${delay}s` }} />
                    ))}
                    <span className="ml-2 text-sm text-indigo-600">Creating products…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FILE PICKER + PREVIEW ─────────────────────────────────────── */}
          {!uploading && !processing && !result && (
            <>
              {/* Redux error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Upload failed</p>
                    <p className="text-sm text-red-700 mt-0.5">{error}</p>
                  </div>
                  <button onClick={reset} className="text-red-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {parseError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-medium">⚠️ {parseError}</p>
                </div>
              )}

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer select-none transition-all duration-200 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · {preview.length} row{preview.length !== 1 ? "s" : ""} detected
                      </p>
                    </div>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">Drop your CSV file here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse · .csv files only</p>
                    <p className="text-xs text-gray-400 mt-3">
                      Required: <span className="font-mono text-indigo-600">name, category, basePrice</span>
                    </p>
                  </>
                )}
              </div>

              {/* Column badges */}
              {headers.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Detected Columns</p>
                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_COLS.map((col) => (
                      <span key={col}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          headers.includes(col)
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                        {headers.includes(col) ? "✓" : "✗"} {col}
                        {!headers.includes(col) && " (missing!)"}
                      </span>
                    ))}
                    {IMPORTANT_COLS.filter((c) => headers.includes(c)).map((col) => (
                      <span key={col} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        ✓ {col}
                      </span>
                    ))}
                    {headers
                      .filter((h) => !REQUIRED_COLS.includes(h) && !IMPORTANT_COLS.includes(h))
                      .map((col) => (
                        <span key={col} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          {col}
                        </span>
                      ))}
                  </div>
                  {missingCols.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      ⚠️ Missing required: <strong>{missingCols.join(", ")}</strong> — fix your CSV and re-upload.
                    </p>
                  )}
                </div>
              )}

              {/* Preview table */}
              {preview.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Preview
                      <span className="text-gray-400 font-normal ml-1">
                        — first {Math.min(10, preview.length)} of {preview.length} rows · {headers.length} columns
                      </span>
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-400 border-b border-gray-200">#</th>
                            {headers.map((h) => (
                              <th key={h}
                                className={`px-3 py-2.5 text-left font-semibold border-b border-gray-200 whitespace-nowrap ${
                                  REQUIRED_COLS.includes(h) ? "text-indigo-600" : "text-gray-500"
                                }`}>
                                {h}{REQUIRED_COLS.includes(h) && <span className="text-red-400">*</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {preview.slice(0, 10).map((row, ri) => (
                            <tr key={ri} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-400">{ri + 1}</td>
                              {headers.map((h) => (
                                <td key={h}
                                  title={row[h]}
                                  className={`px-3 py-2 whitespace-nowrap max-w-[160px] truncate ${
                                    REQUIRED_COLS.includes(h) ? "font-semibold text-gray-900" : "text-gray-600"
                                  } ${!row[h] && REQUIRED_COLS.includes(h) ? "bg-red-50 text-red-500" : ""}`}>
                                  {row[h] || <span className="text-gray-300 italic">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {preview.length > 10 && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                        <span className="text-xs text-gray-400">
                          + {preview.length - 10} more row{preview.length - 10 !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tip */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">📋 Multi-variant products</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Use <strong>multiple rows with the same product name</strong> to create variants.
                  Each row = one variant. Use <span className="font-mono">variantAttributes</span> like{" "}
                  <span className="font-mono bg-amber-100 px-1 rounded">Color:Black|Size:L</span> to differentiate them.
                  Images are uploaded from comma-separated URLs in the <span className="font-mono">images</span> column (max 5 per variant).
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { reset(); onClose(); }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!canUpload}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {preview.length > 0 ? `Import ${preview.length} Rows` : "Upload CSV"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
// import React, { useState, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useDropzone } from 'react-dropzone';
// import {
//   previewBulkUpload,
//   uploadBulkProducts,
//   resetUpload,
//   setCurrentFile,
//   clearPreview,
// } from '../ADMIN_REDUX_MANAGEMENT/bulkUploadSlice';
// import { toast } from 'react-toastify';
// import * as XLSX from 'xlsx';

// const BulkUploadTab = ({onClose }) => {
//   const dispatch = useDispatch();
//   const {
//     uploadProgress,
//     uploadStatus,
//     uploadResult,
//     previewData,
//     previewLoading,
//     previewError,
//     uploadError,
//     currentFile,
//     validationErrors,
//   } = useSelector((state) => state.bulkUpload);

//   const [selectedFile, setSelectedFile] = useState(null);
//   const [showPreview, setShowPreview] = useState(false);
//   const [uploadStep, setUploadStep] = useState('upload'); // 'upload' | 'preview' | 'results'

//   // File dropzone configuration
//   const onDrop = useCallback((acceptedFiles) => {
//     const file = acceptedFiles[0];
//     if (file) {
//       // Check file type
//       const validTypes = [
//         'text/csv',
//         'application/vnd.ms-excel',
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         'application/vnd.oasis.opendocument.spreadsheet',
//       ];
      
//       if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
//         toast.error('Please upload a valid CSV or Excel file');
//         return;
//       }

//       setSelectedFile(file);
//       dispatch(setCurrentFile(file));
//       setShowPreview(false);
//       setUploadStep('upload');
//     }
//   }, [dispatch]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       'text/csv': ['.csv'],
//       'application/vnd.ms-excel': ['.xls'],
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
//     },
//     maxFiles: 1,
//     maxSize: 10 * 1024 * 1024, // 10MB
//   });

//   // Handle file preview
//   const handlePreview = async () => {
//     if (!selectedFile) {
//       toast.error('Please select a file first');
//       return;
//     }

//     try {
//       await dispatch(previewBulkUpload(selectedFile)).unwrap();
//       setShowPreview(true);
//       setUploadStep('preview');
//       toast.success('File preview loaded successfully');
//     } catch (error) {
//       toast.error(error || 'Failed to preview file');
//     }
//   };

//   // Handle file upload
//   const handleUpload = async () => {
//     if (!selectedFile) {
//       toast.error('Please select a file first');
//       return;
//     }

//     try {
//       await dispatch(uploadBulkProducts(selectedFile)).unwrap();
//       setUploadStep('results');
//       toast.success('Bulk upload completed successfully');
//     } catch (error) {
//       toast.error(error || 'Upload failed');
//     }
//   };

//   // Handle reset
//   const handleReset = () => {
//     dispatch(resetUpload());
//     setSelectedFile(null);
//     setShowPreview(false);
//     setUploadStep('upload');
//   };

//   // Download sample CSV
//   const downloadSampleCSV = () => {
//     const headers = [
//       'name',
//       'category',
//       'basePrice',
//       'salePrice',
//       'description',
//       'brand',
//       'status',
//       'isFeatured',
//       'images',
//       'variantAttributes',
//       'productAttributes',
//       'quantity',
//       'weight',
//       'barcode',
//     ];

//     const sampleRow = [
//       'Sample Product',
//       'Electronics',
//       '1999',
//       '1499',
//       'This is a sample product description',
//       'Generic',
//       'active',
//       'true',
//       'https://example.com/image1.jpg,https://example.com/image2.jpg',
//       'color:red|size:xl',
//       'material:cotton|warranty:1year',
//       '100',
//       '500',
//       'SAMPLE123',
//     ];

//     const csvContent = [
//       headers.join(','),
//       sampleRow.join(','),
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'sample_bulk_upload.csv';
//     a.click();
//     window.URL.revokeObjectURL(url);
//   };

//   // Render upload step
//   const renderUploadStep = () => (
//     <div className="space-y-6">
//       {/* Dropzone */}
//       <div
//         {...getRootProps()}
//         className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
//           isDragActive
//             ? 'border-blue-500 bg-blue-50'
//             : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
//         }`}
//       >
//         <input {...getInputProps()} />
//         <div className="space-y-4">
//           <div className="flex justify-center">
//             <svg
//               className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//               />
//             </svg>
//           </div>
//           <div>
//             <p className="text-lg font-medium text-gray-700">
//               {isDragActive
//                 ? 'Drop your file here'
//                 : 'Drag & drop your CSV or Excel file here'}
//             </p>
//             <p className="text-sm text-gray-500 mt-1">or click to browse</p>
//           </div>
//           <div className="flex justify-center gap-4 text-xs text-gray-400">
//             <span>Supported: .csv, .xlsx, .xls</span>
//             <span>•</span>
//             <span>Max size: 10MB</span>
//           </div>
//         </div>
//       </div>

//       {/* Selected file info */}
//       {selectedFile && (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-medium text-gray-900">{selectedFile.name}</p>
//                 <p className="text-sm text-gray-500">
//                   {(selectedFile.size / 1024).toFixed(2)} KB
//                 </p>
//               </div>
//             </div>
//             <div className="flex space-x-2">
//               <button
//                 onClick={handlePreview}
//                 disabled={previewLoading}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {previewLoading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Previewing...
//                   </span>
//                 ) : (
//                   'Preview Data'
//                 )}
//               </button>
//               <button
//                 onClick={() => {
//                   setSelectedFile(null);
//                   dispatch(clearPreview());
//                 }}
//                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Sample download link */}
//       <div className="text-center">
//         <button
//           onClick={downloadSampleCSV}
//           className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center space-x-1"
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//           </svg>
//           <span>Download sample CSV template</span>
//         </button>
//       </div>
//     </div>
//   );

//   // Render preview step
//   const renderPreviewStep = () => (
//     <div className="space-y-6">
//       {/* Preview header */}
//       <div className="flex items-center justify-between">
//         <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-gray-500">
//             {previewData.length} rows found
//           </span>
//           {validationErrors.length > 0 && (
//             <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
//               {validationErrors.length} issues found
//             </span>
//           )}
//         </div>
//       </div>

//       {/* Validation errors */}
//       {validationErrors.length > 0 && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <h4 className="text-sm font-medium text-red-800 mb-2">Validation Issues:</h4>
//           <ul className="space-y-1">
//             {validationErrors.slice(0, 5).map((error, index) => (
//               <li key={index} className="text-sm text-red-600 flex items-start space-x-2">
//                 <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <span>{error.message || error}</span>
//               </li>
//             ))}
//             {validationErrors.length > 5 && (
//               <li className="text-sm text-gray-500">
//                 ...and {validationErrors.length - 5} more issues
//               </li>
//             )}
//           </ul>
//         </div>
//       )}

//       {/* Preview table */}
//       <div className="border border-gray-200 rounded-lg overflow-hidden">
//         <div className="max-h-96 overflow-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50 sticky top-0">
//               <tr>
//                 {previewData[0] && Object.keys(previewData[0]).map((header) => (
//                   <th
//                     key={header}
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     {header}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {previewData.slice(0, 10).map((row, rowIndex) => (
//                 <tr key={rowIndex} className="hover:bg-gray-50">
//                   {Object.values(row).map((value, colIndex) => (
//                     <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
//                       {value || '-'}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         {previewData.length > 10 && (
//           <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 border-t">
//             Showing first 10 of {previewData.length} rows
//           </div>
//         )}
//       </div>

//       {/* Action buttons */}
//       <div className="flex justify-end space-x-3">
//         <button
//           onClick={() => setUploadStep('upload')}
//           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//         >
//           Back
//         </button>
//         <button
//           onClick={handleUpload}
//           disabled={uploadStatus === 'uploading' || validationErrors.length > 0}
//           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {uploadStatus === 'uploading' ? (
//             <span className="flex items-center">
//               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//               </svg>
//               Uploading...
//             </span>
//           ) : (
//             'Proceed to Upload'
//           )}
//         </button>
//       </div>

//       {/* Upload progress */}
//       {uploadStatus === 'uploading' && (
//         <div className="mt-4">
//           <div className="flex justify-between text-sm text-gray-600 mb-1">
//             <span>Uploading...</span>
//             <span>{uploadProgress}%</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${uploadProgress}%` }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Error message */}
//       {previewError && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <p className="text-sm text-red-600">{previewError}</p>
//         </div>
//       )}
//     </div>
//   );

//   // Render results step
//   const renderResultsStep = () => (
//     <div className="space-y-6">
//       <div className="text-center">
//         <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
//           <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//           </svg>
//         </div>
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Complete!</h3>
//         <p className="text-gray-500">Your bulk upload has been processed successfully</p>
//       </div>

//       {uploadResult && (
//         <div className="bg-gray-50 rounded-lg p-6">
//           <div className="grid grid-cols-3 gap-4 mb-6">
//             <div className="text-center">
//               <p className="text-2xl font-bold text-blue-600">{uploadResult.totalRows || 0}</p>
//               <p className="text-sm text-gray-500">Total Rows</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-green-600">{uploadResult.insertedProducts || 0}</p>
//               <p className="text-sm text-gray-500">Products Added</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-red-600">{uploadResult.failedCount || 0}</p>
//               <p className="text-sm text-gray-500">Failed</p>
//             </div>
//           </div>

//           {uploadResult.failed && uploadResult.failed.length > 0 && (
//             <div>
//               <h4 className="font-medium text-gray-900 mb-2">Failed Items:</h4>
//               <div className="max-h-40 overflow-auto">
//                 {uploadResult.failed.map((fail, index) => (
//                   <div key={index} className="text-sm text-red-600 py-1 border-b border-red-100">
//                     {fail.product}: {fail.error}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="flex justify-center space-x-3">
//         <button
//           onClick={handleReset}
//           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           Upload Another File
//         </button>
//         <button
//           onClick={() => window.location.reload()}
//           className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//         >
//           Go to Products
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-gray-900">Bulk Product Upload</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Upload multiple products at once using CSV or Excel files
//             </p>
//           </div>
//           <div className="flex items-center space-x-2">
//             {['upload', 'preview', 'results'].map((step, index) => (
//               <div key={step} className="flex items-center">
//                 <div
//                   className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
//                     uploadStep === step
//                       ? 'bg-blue-600 text-white'
//                       : index < ['upload', 'preview', 'results'].indexOf(uploadStep)
//                       ? 'bg-green-100 text-green-600'
//                       : 'bg-gray-100 text-gray-400'
//                   }`}
//                 >
//                   {index + 1}
//                 </div>
//                 {index < 2 && (
//                   <div className={`w-12 h-0.5 mx-1 ${
//                     index < ['upload', 'preview', 'results'].indexOf(uploadStep) - 1
//                       ? 'bg-green-500'
//                       : 'bg-gray-200'
//                   }`} />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="p-6">
//         {uploadStep === 'upload' && renderUploadStep()}
//         {uploadStep === 'preview' && renderPreviewStep()}
//         {uploadStep === 'results' && renderResultsStep()}
//       </div>
//     </div>
//   );
// };

// export default BulkUploadTab;