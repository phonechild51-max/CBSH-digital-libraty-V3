"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { updateMaterial, deleteTeacherMaterial } from "./actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import { SUBJECTS } from "@/lib/constants";
import {
  Search,
  Trash2,
  Edit3,
  FileText,
  Image as ImageIcon,
  X,
  Download,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  semester: number | null;
  tags: string | null;
  file_type: string | null;
  file_size: number | null;
  download_count: number;
  upload_date: string;
  insforge_file_key: string | null;
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [editTarget, setEditTarget] = useState<Material | null>(null);
  const [isPending, startTransition] = useTransition();
  const { session } = useSession();
  const { user } = useUser();

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    tags: "",
  });

  const fetchMaterials = useCallback(async () => {
    if (!session || !user) return;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get user's supabase ID
    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    const { data } = await sb
      .from("materials")
      .select(
        "id, title, description, subject, semester, tags, file_type, file_size, download_count, upload_date, insforge_file_key"
      )
      .eq("uploaded_by", userData.id)
      .order("upload_date", { ascending: false });

    if (data) setMaterials(data);
    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filtered = materials.filter(
    (m) => !search || m.title.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (m: Material) => {
    setEditTarget(m);
    setEditForm({
      title: m.title,
      description: m.description || "",
      subject: m.subject,
      semester: m.semester?.toString() || "",
      tags: m.tags || "",
    });
  };

  const handleEdit = () => {
    if (!editTarget) return;
    const target = editTarget;
    startTransition(async () => {
      await updateMaterial(target.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        subject: editForm.subject,
        semester: editForm.semester ? parseInt(editForm.semester) : null,
        tags: editForm.tags.trim() || null,
      });
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === target.id
            ? {
                ...m,
                title: editForm.title.trim(),
                description: editForm.description.trim() || null,
                subject: editForm.subject,
                semester: editForm.semester ? parseInt(editForm.semester) : null,
                tags: editForm.tags.trim() || null,
              }
            : m
        )
      );
      setEditTarget(null);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      await deleteTeacherMaterial(target.id, target.insforge_file_key);
      setMaterials((prev) => prev.filter((m) => m.id !== target.id));
      setDeleteTarget(null);
    });
  };

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          My Materials
        </h2>
        <Badge
          className="text-xs px-2.5 py-1"
          style={{
            backgroundColor: "var(--color-accent-amber-subtle)",
            color: "var(--color-accent-amber)",
            border: "1px solid var(--color-accent-amber)",
          }}
        >
          {materials.length} total
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={inputStyle}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{
              borderColor: "var(--color-border-divider)",
              borderTopColor: "var(--color-accent-amber)",
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search
              ? "No materials found matching your search."
              : "You haven't uploaded any materials yet."}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border-card)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-card)" }}>
                  {[
                    "Title",
                    "Subject",
                    "Sem",
                    "Type",
                    "Size",
                    "Downloads",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--color-text-muted)",
                        borderBottom: "1px solid var(--color-border-divider)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid var(--color-border-divider)",
                    }}
                  >
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {m.title}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-[10px] px-2 py-0.5"
                        style={{
                          backgroundColor: "var(--color-accent-amber-subtle)",
                          color: "var(--color-accent-amber)",
                          border: "1px solid var(--color-accent-amber)",
                        }}
                      >
                        {m.subject}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {m.semester || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="flex items-center gap-1"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {m.file_type === "pdf" ? (
                          <FileText size={14} />
                        ) : (
                          <ImageIcon size={14} />
                        )}
                        {m.file_type?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {m.file_size ? formatFileSize(m.file_size) : "—"}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <Download size={12} />
                        {m.download_count}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {formatDate(m.upload_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-accent-amber-glow)]"
                          style={{ color: "var(--color-accent-amber)" }}
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                          style={{ color: "var(--color-danger)" }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditTarget(null)}
          />
          <div
            className="relative w-full max-w-lg rounded-xl p-6 space-y-4 z-10"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-heading)",
                }}
              >
                Edit Material
              </h3>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Title"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
              <select
                value={editForm.subject}
                onChange={(e) =>
                  setEditForm({ ...editForm, subject: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.semester}
                  onChange={(e) =>
                    setEditForm({ ...editForm, semester: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                >
                  <option value="">No semester</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Semester {i + 1}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value })
                  }
                  placeholder="Tags (comma-separated)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleEdit}
                disabled={isPending || !editForm.title.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent-amber)",
                  color: "#000",
                }}
              >
                {isPending ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-card)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove the file from storage. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
