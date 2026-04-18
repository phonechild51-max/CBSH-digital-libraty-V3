"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
} from "./actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Trash2, Edit3, Plus, Send, CheckCircle2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_role: string;
  expiry_date: string | null;
  created_at: string;
  created_by: string;
  is_published?: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  normal: { bg: "var(--color-bg-input)", color: "var(--color-text-secondary)" },
  important: { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" },
  urgent: { bg: "var(--color-danger-subtle)", color: "var(--color-danger)" },
};

const emptyForm = {
  title: "",
  content: "",
  priority: "normal",
  target_role: "all",
  expiry_date: "",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [publishTarget, setPublishTarget] = useState<Announcement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const { session } = useSession();
  const { user } = useUser();

  // Get supabase user id
  useEffect(() => {
    async function getSupabaseId() {
      if (!session || !user) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("users")
        .select("id")
        .eq("insforge_uid", user.id)
        .single();

      if (data) setSupabaseUserId(data.id);
    }
    getSupabaseId();
  }, [session, user]);

  // Fetch announcements
  useEffect(() => {
    async function fetch() {
      if (!session) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setAnnouncements(data);
      setLoading(false);
    }
    fetch();
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !supabaseUserId) return;

    startTransition(async () => {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: form.title,
          content: form.content,
          priority: form.priority,
          target_role: form.target_role,
          expiry_date: form.expiry_date || null,
        });
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? { ...a, ...form, expiry_date: form.expiry_date || null }
              : a
          )
        );
        setEditingId(null);
      } else {
        await createAnnouncement({
          ...form,
          expiry_date: form.expiry_date || null,
        });
        // Refetch to get the new item with its generated ID
        if (!session) return;
        const token = await session.getToken({ template: "supabase" });
        if (!token) return;
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { data } = await sb
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setAnnouncements(data);
      }
      setForm(emptyForm);
    });
  };

  const handleEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      target_role: a.target_role,
      expiry_date: a.expiry_date?.split("T")[0] || "",
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      await deleteAnnouncement(target.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== target.id));
      setDeleteTarget(null);
    });
  };

  const handlePublish = () => {
    if (!publishTarget) return;
    const target = publishTarget;
    startTransition(async () => {
      await publishAnnouncement(target.id);
      setAnnouncements((prev) => prev.map((a) => a.id === target.id ? { ...a, is_published: true } : a));
      setPublishTarget(null);
    });
  };

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}
      >
        Announcements
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form — Right on desktop */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl p-5 space-y-4 sticky top-4"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <h3
              className="text-md font-semibold flex items-center gap-2"
              style={{ color: "var(--color-text-heading)" }}
            >
              {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h3>

            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />

            <textarea
              placeholder="Content..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
              style={inputStyle}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                className="px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
              </select>
            </div>

            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                try {
                  (e.target as HTMLInputElement).showPicker();
                } catch {
                  // Ignore if unsupported
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer"
              style={inputStyle}
              placeholder="Expiry date (optional)"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent-amber)",
                  color: "#000",
                }}
              >
                {isPending ? "Saving…" : editingId ? "Update" : "Save as Draft"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: "var(--color-bg-input)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-card)",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List — Left on desktop */}
        <div className="lg:col-span-3 order-2 lg:order-1 space-y-3">
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
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No announcements yet. Create one to get started.
              </p>
            </div>
          ) : (
            announcements.map((a) => {
              const pStyle = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.normal;
              return (
                <div
                  key={a.id}
                  className="rounded-xl p-4 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border-card)",
                    borderLeft: `3px solid ${pStyle.color}`,
                    opacity: a.is_published ? 1 : 0.8,
                  }}
                  onClick={() => handleEdit(a)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--color-text-heading)" }}
                        >
                          {a.title}
                        </h4>
                        <Badge
                          className="text-[10px] px-1.5 py-0 capitalize border-none"
                          style={{ backgroundColor: pStyle.bg, color: pStyle.color }}
                        >
                          {a.priority}
                        </Badge>
                        <Badge
                          className="text-[10px] px-1.5 py-0 capitalize"
                          style={{
                            backgroundColor: "var(--color-bg-input)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {a.target_role}
                        </Badge>
                        {a.is_published ? (
                          <Badge
                            className="text-[10px] px-1.5 py-0 border-none items-center gap-1"
                            style={{
                              backgroundColor: "var(--color-success-subtle)",
                              color: "var(--color-success)",
                            }}
                          >
                            <CheckCircle2 size={10} /> Published
                          </Badge>
                        ) : (
                          <Badge
                            className="text-[10px] px-1.5 py-0 border-none items-center gap-1"
                            style={{
                              backgroundColor: "var(--color-bg-input)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {a.content}
                      </p>
                      <p
                        className="text-[10px] mt-2"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatDate(a.created_at)}
                        {a.expiry_date && ` · Expires ${formatDate(a.expiry_date)}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {!a.is_published && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPublishTarget(a);
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-accent-amber-subtle)]"
                          style={{ color: "var(--color-accent-amber)" }}
                          title="Publish"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(a);
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                        style={{ color: "var(--color-danger)" }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        open={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
        title="Publish Announcement"
        description={`Are you sure you want to publish "${publishTarget?.title}"? This will send a notification to all targeted users immediately.`}
        confirmLabel="Publish"
        variant="primary"
      />
    </div>
  );
}
