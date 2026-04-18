"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { formatDate, formatFileSize } from "@/lib/utils";
import { SUBJECTS } from "@/lib/constants";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Download,
  Bookmark,
  BookmarkCheck,
  Filter,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

const PAGE_SIZE = 12;

export default function BrowseMaterialsPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [supabaseUserId, setSupabaseUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [typeFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Memoised Supabase client
  const tokenRef = useRef<string | null>(null);
  const sbRef = useRef<ReturnType<typeof import('@supabase/supabase-js').createClient> | null>(null);

  const fetchData = useCallback(async () => {
    if (!session || !user) return;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return;

    // Memoize client to avoid pool exhaustion
    if (token !== tokenRef.current || !sbRef.current) {
      tokenRef.current = token;
      sbRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }
    const sb = sbRef.current;

    // Get supabase user ID
    const { data: userRaw } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userRaw) {
      setLoading(false);
      return;
    }
    const userData = userRaw as { id: string };

    setSupabaseUserId(userData.id);

    // Fetch materials and bookmarks in parallel
    const [materialsRes, bookmarksRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb as any)
        .from("materials")
        .select(
          "id, title, description, subject, semester, tags, file_type, file_size, download_count, upload_date"
        )
        .order("upload_date", { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb as any)
        .from("bookmarks")
        .select("material_id")
        .eq("user_id", userData.id),
    ]);

    if (materialsRes.data) setMaterials(materialsRes.data as Material[]);
    if (bookmarksRes.data) {
      setBookmarkedIds((bookmarksRes.data as { material_id: string }[]).map((b) => b.material_id));
    }

    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filtered = materials
    .filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.title.toLowerCase().includes(q) &&
          !(m.description ?? "").toLowerCase().includes(q) &&
          !(m.tags ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      if (subjectFilter && m.subject !== subjectFilter) return false;
      if (semesterFilter && m.semester !== parseInt(semesterFilter))
        return false;
      if (typeFilter && m.file_type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.upload_date).getTime() -
            new Date(b.upload_date).getTime()
          );
        case "downloads":
          return b.download_count - a.download_count;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return (
            new Date(b.upload_date).getTime() -
            new Date(a.upload_date).getTime()
          );
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Optimistic bookmark toggle
  const toggleBookmark = async (materialId: string, isBookmarked: boolean) => {
    if (!session || !supabaseUserId) return;

    // Flip UI immediately
    setBookmarkedIds((prev) =>
      isBookmarked
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );

    try {
      const token = await session.getToken({ template: "supabase" });
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      if (isBookmarked) {
        await sb
          .from("bookmarks")
          .delete()
          .match({ user_id: supabaseUserId, material_id: materialId });
      } else {
        await sb
          .from("bookmarks")
          .insert({ user_id: supabaseUserId, material_id: materialId });
      }
    } catch {
      // Revert on failure
      setBookmarkedIds((prev) =>
        isBookmarked
          ? [...prev, materialId]
          : prev.filter((id) => id !== materialId)
      );
    }
  };

  // Download handler
  const handleDownload = async (materialId: string) => {
    setDownloading(materialId);
    try {
      const res = await fetch(`/api/materials/${materialId}/download`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
        // Update local download count
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === materialId
              ? { ...m, download_count: m.download_count + 1 }
              : m
          )
        );
      }
    } catch {
      // Silently fail
    }
    setDownloading(null);
  };

  const selectStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Browse Materials
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Search and download study materials uploaded by teachers.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} style={{ color: "var(--color-accent-amber)" }} />
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search by title, topic or tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{
                ...selectStyle,
                borderColor: search
                  ? "var(--color-border-focus)"
                  : "var(--color-border-input)",
              }}
            />
          </div>

          {/* Subject */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={selectStyle}
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Semester */}
          <select
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={selectStyle}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={selectStyle}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="downloads">Most Downloaded</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} materials
        </p>
      )}

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <BookOpen
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            No materials found
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((m) => {
              const isBookmarked = bookmarkedIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border-card)",
                  }}
                >
                  {/* File type header */}
                  <div
                    className="p-4 flex items-center gap-3"
                    style={{
                      borderBottom: "1px solid var(--color-border-divider)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          m.file_type === "pdf"
                            ? "var(--color-danger-subtle)"
                            : "var(--color-info)15",
                      }}
                    >
                      {m.file_type === "pdf" ? (
                        <FileText
                          size={20}
                          style={{ color: "var(--color-danger)" }}
                        />
                      ) : (
                        <ImageIcon
                          size={20}
                          style={{ color: "var(--color-info)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color:
                            m.file_type === "pdf"
                              ? "var(--color-danger)"
                              : "var(--color-info)",
                        }}
                      >
                        {m.file_type?.toUpperCase() || "FILE"}
                      </span>
                      {m.file_size && (
                        <span
                          className="text-[10px] ml-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatFileSize(m.file_size)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3
                      className="text-sm font-semibold mb-2 line-clamp-2"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--color-text-heading)",
                        minHeight: "2.5em",
                      }}
                    >
                      {m.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-2">
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
                      {m.semester && (
                        <Badge
                          className="text-[10px] px-2 py-0.5"
                          style={{
                            backgroundColor: "var(--color-bg-input)",
                            color: "var(--color-text-secondary)",
                            border: "1px solid var(--color-border-input)",
                          }}
                        >
                          Sem {m.semester}
                        </Badge>
                      )}
                    </div>

                    {m.description && (
                      <p
                        className="text-xs line-clamp-3 mb-3"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{
                      borderTop: "1px solid var(--color-border-divider)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Download size={12} />
                        {m.download_count}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatDate(m.upload_date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bookmark toggle */}
                      <button
                        onClick={() => toggleBookmark(m.id, isBookmarked)}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        aria-label={
                          isBookmarked
                            ? "Remove bookmark"
                            : "Add bookmark"
                        }
                      >
                        {isBookmarked ? (
                          <BookmarkCheck
                            size={18}
                            style={{ color: "var(--color-accent-amber)" }}
                          />
                        ) : (
                          <Bookmark
                            size={18}
                            style={{ color: "var(--color-text-muted)" }}
                          />
                        )}
                      </button>

                      {/* Download button */}
                      <button
                        onClick={() => handleDownload(m.id)}
                        disabled={downloading === m.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--color-accent-amber)",
                          color: "#000",
                        }}
                      >
                        {downloading === m.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Download"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
}
