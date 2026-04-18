"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { formatDate } from "@/lib/utils";
import {
  Download,
  Bookmark,
  FileText,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DownloadRecord {
  id: string;
  downloaded_at: string;
  materials: {
    id: string;
    title: string;
    subject: string;
    file_type: string | null;
  };
}

interface BookmarkRecord {
  id: string;
  created_at: string;
  material_id: string;
  materials: {
    id: string;
    title: string;
    subject: string;
    semester: number | null;
    file_type: string | null;
    download_count: number;
    upload_date: string;
  };
}

type Tab = "downloads" | "bookmarks";

export default function DownloadsBookmarksPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [tab, setTab] = useState<Tab>("downloads");
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [supabaseUserId, setSupabaseUserId] = useState("");
  const [loading, setLoading] = useState(true);
  // Memoised client — rebuilt only when token changes
  const tokenRef = useRef<string | null>(null);
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);

  const getClient = useCallback(async () => {
    if (!session) return null;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return null;
    if (token !== tokenRef.current || !sbRef.current) {
      tokenRef.current = token;
      sbRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }
    return sbRef.current;
  }, [session]);

  const fetchData = useCallback(async () => {
    if (!session || !user) return;
    const sb = await getClient();
    if (!sb) return;

    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    setSupabaseUserId(userData.id);

    const [downloadsRes, bookmarksRes] = await Promise.all([
      sb
        .from("downloads")
        .select("id, downloaded_at, materials(id, title, subject, file_type)")
        .eq("user_id", userData.id)
        .order("downloaded_at", { ascending: false }),
      sb
        .from("bookmarks")
        .select(
          "id, created_at, material_id, materials(id, title, subject, semester, file_type, download_count, upload_date)"
        )
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false }),
    ]);

    if (downloadsRes.data)
      setDownloads(downloadsRes.data as unknown as DownloadRecord[]);
    if (bookmarksRes.data)
      setBookmarks(bookmarksRes.data as unknown as BookmarkRecord[]);

    setLoading(false);
  }, [session, user, getClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const removeBookmark = async (bookmarkId: string, materialId: string) => {
    if (!supabaseUserId) return;

    // Optimistic removal
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

    try {
      const sb = await getClient();
      if (!sb) throw new Error("No client");
      await sb
        .from("bookmarks")
        .delete()
        .match({ user_id: supabaseUserId, material_id: materialId });
    } catch {
      // Refetch on failure
      fetchData();
    }
  };

  const tabStyle = (active: boolean) => ({
    color: active ? "var(--color-accent-amber)" : "var(--color-text-secondary)",
    borderBottom: active ? "2px solid var(--color-accent-amber)" : "2px solid transparent",
    backgroundColor: "transparent",
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Downloads & Bookmarks
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Track your downloaded materials and saved bookmarks.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1"
        style={{ borderBottom: "1px solid var(--color-border-divider)" }}
      >
        <button
          onClick={() => setTab("downloads")}
          className="px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2"
          style={tabStyle(tab === "downloads")}
        >
          <Download size={16} />
          My Downloads
          {!loading && (
            <Badge
              className="text-[10px] px-1.5 py-0 ml-1"
              style={{
                backgroundColor: "var(--color-bg-input)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-input)",
              }}
            >
              {downloads.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className="px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2"
          style={tabStyle(tab === "bookmarks")}
        >
          <Bookmark size={16} />
          My Bookmarks
          {!loading && (
            <Badge
              className="text-[10px] px-1.5 py-0 ml-1"
              style={{
                backgroundColor: "var(--color-bg-input)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-input)",
              }}
            >
              {bookmarks.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            />
          ))}
        </div>
      ) : tab === "downloads" ? (
        /* Downloads Tab */
        downloads.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <Download
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
              No downloads yet
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Browse materials and download them to see them here.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border-divider)",
                  }}
                >
                  {["Title", "Subject", "Type", "Downloaded"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr
                    key={d.id}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid var(--color-border-divider)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={14}
                          style={{ color: "var(--color-accent-amber)" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {d.materials?.title ?? "Untitled"}
                        </span>
                      </div>
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
                        {d.materials?.subject ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs uppercase font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {d.materials?.file_type ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatDate(d.downloaded_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : /* Bookmarks Tab */
      bookmarks.length === 0 ? (
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
            No bookmarks yet
          </p>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Star materials while browsing to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="rounded-xl p-4 transition-all duration-200"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText
                    size={16}
                    style={{ color: "var(--color-accent-amber)" }}
                  />
                  <h4
                    className="text-sm font-semibold line-clamp-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {b.materials?.title ?? "Untitled"}
                  </h4>
                </div>
                <button
                  onClick={() => removeBookmark(b.id, b.material_id)}
                  className="p-1 rounded-lg transition-colors hover:bg-[var(--color-bg-input)]"
                  style={{ color: "var(--color-danger)" }}
                  title="Remove bookmark"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge
                  className="text-[10px] px-2 py-0.5"
                  style={{
                    backgroundColor: "var(--color-accent-amber-subtle)",
                    color: "var(--color-accent-amber)",
                    border: "1px solid var(--color-accent-amber)",
                  }}
                >
                  {b.materials?.subject ?? "—"}
                </Badge>
                {b.materials?.semester && (
                  <Badge
                    className="text-[10px] px-2 py-0.5"
                    style={{
                      backgroundColor: "var(--color-bg-input)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border-input)",
                    }}
                  >
                    Sem {b.materials.semester}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Download size={12} />
                  {b.materials?.download_count ?? 0}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Bookmarked {formatDate(b.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
