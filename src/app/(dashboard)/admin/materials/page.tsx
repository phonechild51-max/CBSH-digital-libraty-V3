"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { deleteMaterial } from "./actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import { SUBJECTS } from "@/lib/constants";
import { Search, Trash2, FileText, Image as ImageIcon } from "lucide-react";

interface Material {
  id: string;
  title: string;
  subject: string;
  semester: number | null;
  file_type: string | null;
  file_size: number | null;
  download_count: number;
  upload_date: string;
  insforge_file_key: string | null;
  users: { name: string } | null;
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [, startTransition] = useTransition();
  const { session } = useSession();

  useEffect(() => {
    async function fetchMaterials() {
      if (!session) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("materials")
        .select("id, title, subject, semester, file_type, file_size, download_count, upload_date, insforge_file_key, users(name)")
        .order("upload_date", { ascending: false });

      if (data) setMaterials(data as unknown as Material[]);
      setLoading(false);
    }
    fetchMaterials();
  }, [session]);

  const filtered = materials.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || m.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      await deleteMaterial(target.id, target.insforge_file_key);
      setMaterials((prev) => prev.filter((m) => m.id !== target.id));
      setDeleteTarget(null);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}
      >
        View Materials
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
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
            style={{
              backgroundColor: "var(--color-bg-input)",
              border: "1px solid var(--color-border-input)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--color-bg-input)",
            border: "1px solid var(--color-border-input)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
          <FileText size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No materials found.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--color-border-card)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-card)" }}>
                  {["Title", "Subject", "Sem", "Type", "Size", "Downloads", "Uploaded By", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-divider)" }}
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
                    style={{ borderBottom: "1px solid var(--color-border-divider)" }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
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
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {m.semester || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                        {m.file_type === "pdf" ? <FileText size={14} /> : <ImageIcon size={14} />}
                        {m.file_type?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {m.file_size ? formatFileSize(m.file_size) : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                      {m.download_count}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {m.users?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(m.upload_date)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                        style={{ color: "var(--color-danger)" }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
