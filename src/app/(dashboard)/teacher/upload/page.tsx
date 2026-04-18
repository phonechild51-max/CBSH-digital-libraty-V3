"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { insertMaterial } from "./actions";
import { SUBJECTS, MAX_UPLOAD_MB, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatFileSize } from "@/lib/utils";
import {

  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from "lucide-react";

type FileCheck = {
  label: string;
  passed: boolean | null;
};

const ALLOWED_TYPES: Record<string, { type: "pdf" | "image"; label: string }> = {
  "application/pdf": { type: "pdf", label: "PDF" },
  "image/jpeg": { type: "image", label: "JPG" },
  "image/png": { type: "image", label: "PNG" },
};

export default function UploadMaterialPage() {
  const { session } = useSession();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [tags, setTags] = useState("");

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File validation checks
  const [checks, setChecks] = useState<FileCheck[]>([
    { label: "File type: PDF, JPG, or PNG", passed: null },
    { label: `File size: under ${MAX_UPLOAD_MB}MB`, passed: null },
  ]);



  const validateFile = useCallback(
    (f: File): string | null => {
      const newChecks: FileCheck[] = [
        {
          label: `File type: ${f.type in ALLOWED_TYPES ? ALLOWED_TYPES[f.type].label + " ✓" : "Invalid"}`,
          passed: f.type in ALLOWED_TYPES,
        },
        {
          label: `File size: ${formatFileSize(f.size)} ${f.size <= MAX_UPLOAD_BYTES ? "✓" : "(too large)"}`,
          passed: f.size <= MAX_UPLOAD_BYTES,
        },
      ];
      setChecks(newChecks);

      if (!(f.type in ALLOWED_TYPES)) {
        return "Only PDF, JPG, and PNG files are allowed.";
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        return `File must be under ${MAX_UPLOAD_MB}MB.`;
      }
      return null;
    },
    []
  );

  const handleFileSelect = useCallback(
    (f: File) => {
      setSuccess(false);
      setUploadError(null);
      const err = validateFile(f);
      if (err) {
        setFileError(err);
        setFile(null);
      } else {
        setFileError(null);
        setFile(f);
      }
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session || !user || !title.trim() || !subject) return;

    setUploading(true);
    setProgress(0);
    setUploadError(null);

    try {
      const token = await session.getToken({ template: "supabase" });
      if (!token) throw new Error("No token");

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      // Get supabase user id
      const { data: userData } = await sb
        .from("users")
        .select("id")
        .eq("insforge_uid", user.id)
        .single();

      if (!userData) throw new Error("User not found in database");

      // Simulate progress (goes to 90% then finishes)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const subjectSlug = subject.toLowerCase().replace(/\s+/g, "-");
      const uuid = crypto.randomUUID();
      const filePath = `materials/${subjectSlug}/${uuid}-${file.name}`;

      // Upload to storage
      const { error: uploadErr } = await sb.storage
        .from("cbsh-library")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      clearInterval(interval);

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      setProgress(95);

      // Insert DB record via server action
      const fileType = ALLOWED_TYPES[file.type]?.type || "pdf";

      startTransition(async () => {
        try {
          await insertMaterial({
            title: title.trim(),
            description: description.trim() || null,
            subject,
            semester: semester ? parseInt(semester) : null,
            tags: tags.trim() || null,
            insforge_file_key: filePath,
            file_type: fileType,
            file_size: file.size,
            mime_type: file.type,
          });

          setProgress(100);
          setSuccess(true);

          // Reset form
          setTimeout(() => {
            setTitle("");
            setSubject("");
            setDescription("");
            setSemester("");
            setTags("");
            setFile(null);
            setChecks([
              { label: "File type: PDF, JPG, or PNG", passed: null },
              { label: `File size: under ${MAX_UPLOAD_MB}MB`, passed: null },
            ]);
            setProgress(0);
          }, 2000);
        } catch (err: unknown) {
          setUploadError(err instanceof Error ? err.message : "Failed to save material record");
        }
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    setChecks([
      { label: "File type: PDF, JPG, or PNG", passed: null },
      { label: `File size: under ${MAX_UPLOAD_MB}MB`, passed: null },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  const canSubmit = file && !fileError && title.trim() && subject && !uploading && !isPending;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-text-heading)",
        }}
      >
        Upload Material
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">
          {/* Left Column — Form (55%) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Title */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Title <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter material title..."
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>

            {/* Subject */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Subject <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </div>

            {/* Semester & Tags row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Semester {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className="relative rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
              style={{
                border: dragging
                  ? "2px solid var(--color-accent-amber)"
                  : file
                  ? "2px solid var(--color-success)"
                  : "2px dashed var(--color-border-input)",
                backgroundColor: dragging
                  ? "var(--color-accent-amber-glow)"
                  : "var(--color-bg-input)",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  {file.type === "application/pdf" ? (
                    <FileText size={28} style={{ color: "var(--color-danger)" }} />
                  ) : (
                    <ImageIcon size={28} style={{ color: "var(--color-info)" }} />
                  )}
                  <div className="text-left">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {file.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="p-1 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <CloudUpload
                    size={48}
                    className="mx-auto mb-3"
                    style={{
                      color: dragging
                        ? "var(--color-accent-amber)"
                        : "var(--color-text-muted)",
                    }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Drag and drop your file here
                  </p>
                  <p className="text-xs mt-1">
                    <span style={{ color: "var(--color-accent-amber)" }}>
                      or click to browse
                    </span>
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    PDF, JPG, PNG — max {MAX_UPLOAD_MB}MB
                  </p>
                </>
              )}
            </div>

            {/* File Error */}
            {fileError && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--color-danger-subtle)",
                  color: "var(--color-danger)",
                  border: "1px solid var(--color-danger)",
                }}
              >
                <AlertCircle size={16} />
                {fileError}
              </div>
            )}

            {/* Progress Bar */}
            {(uploading || isPending) && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Uploading...
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "var(--color-accent-amber)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {Math.round(progress)}%
                  </p>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-bg-input)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: "var(--color-accent-amber)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-accent-amber)",
                color: "#000",
              }}
            >
              {uploading || isPending ? "Uploading…" : "Upload Material"}
            </button>
          </div>

          {/* Right Column — Validation & Status (45%) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Validation Checklist */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--color-text-heading)" }}
              >
                File Validation
              </h3>
              <div className="space-y-3">
                {checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {check.passed === null ? (
                      <div
                        className="w-5 h-5 rounded-full border-2"
                        style={{ borderColor: "var(--color-border-input)" }}
                      />
                    ) : check.passed ? (
                      <CheckCircle2
                        size={20}
                        style={{ color: "var(--color-success)" }}
                      />
                    ) : (
                      <AlertCircle
                        size={20}
                        style={{ color: "var(--color-danger)" }}
                      />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color:
                          check.passed === null
                            ? "var(--color-text-muted)"
                            : check.passed
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                      }}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  backgroundColor: "var(--color-danger-subtle)",
                  borderLeft: "4px solid var(--color-danger)",
                }}
              >
                <AlertCircle
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-danger)" }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Upload Error
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {uploadError}
                  </p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div
                className="rounded-xl p-4 flex items-start gap-3 animate-fade-in-up"
                style={{
                  backgroundColor: "var(--color-success-subtle)",
                  borderLeft: "4px solid var(--color-success)",
                }}
              >
                <CheckCircle2
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-success)" }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-success)" }}
                  >
                    Material uploaded successfully!
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Your material is now available in the library.
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--color-text-heading)" }}
              >
                Upload Tips
              </h3>
              <ul className="space-y-2">
                {[
                  "Use clear, descriptive titles for better discoverability",
                  "Add tags to help students find relevant materials",
                  "PDF documents are recommended for text content",
                  "Image formats are best for diagrams and illustrations",
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-start gap-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <span
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "var(--color-accent-amber)" }}
                    >
                      •
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
