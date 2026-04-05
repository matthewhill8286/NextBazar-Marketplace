"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  label: string;
  content: string;
  is_preset: boolean;
  sort_order: number;
};

export default function QuickReplyManager() {
  const supabase = createClient();
  const [presets, setPresets] = useState<Template[]>([]);
  const [custom, setCustom] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Edit / create state
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("quick_reply_templates")
      .select("id, label, content, is_preset, sort_order")
      .or(`is_preset.eq.true,user_id.eq.${user.id}`)
      .order("sort_order", { ascending: true });

    if (data) {
      setPresets(data.filter((t: Template) => t.is_preset));
      setCustom(data.filter((t: Template) => !t.is_preset));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setFormLabel("");
    setFormContent("");
  };

  const startEdit = (t: Template) => {
    setCreating(false);
    setEditing(t);
    setFormLabel(t.label);
    setFormContent(t.content);
  };

  const cancelForm = () => {
    setEditing(null);
    setCreating(false);
    setFormLabel("");
    setFormContent("");
  };

  const handleSave = async () => {
    if (!formLabel.trim() || !formContent.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (editing) {
      await supabase
        .from("quick_reply_templates")
        .update({
          label: formLabel.trim(),
          content: formContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
    } else {
      await supabase.from("quick_reply_templates").insert({
        user_id: user.id,
        label: formLabel.trim(),
        content: formContent.trim(),
        is_preset: false,
        sort_order: custom.length + 1,
      });
    }

    setSaving(false);
    cancelForm();
    load();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("quick_reply_templates").delete().eq("id", id);
    setDeleting(null);
    load();
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex items-center gap-2 text-[#8a8280]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e8e6e3]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#faf9f7] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#f0eeeb] flex items-center justify-center">
            <MessageSquareText className="w-4 h-4 text-[#6b6560]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Quick Reply Templates
            </h3>
            <p className="text-xs text-[#8a8280]">
              {presets.length + custom.length} templates available
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#8a8280]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8a8280]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#e8e6e3] p-5 space-y-5">
          {/* Preset templates */}
          {presets.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-3">
                Default Templates
              </p>
              <div className="space-y-2">
                {presets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 bg-[#faf9f7] border border-[#e8e6e3]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1a1a1a] mb-0.5">
                        {t.label}
                      </p>
                      <p className="text-xs text-[#6b6560] leading-relaxed">
                        {t.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom templates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase">
                Your Templates
              </p>
              <button
                onClick={startCreate}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#8E7A6B] hover:text-[#6b5d50] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add template
              </button>
            </div>

            {custom.length === 0 && !creating && (
              <p className="text-xs text-[#8a8280] italic">
                No custom templates yet. Create one to speed up your replies.
              </p>
            )}

            <div className="space-y-2">
              {custom.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 bg-white border border-[#e8e6e3] group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1a1a1a] mb-0.5">
                      {t.label}
                    </p>
                    <p className="text-xs text-[#6b6560] leading-relaxed">
                      {t.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(t)}
                      className="p-1.5 text-[#8a8280] hover:text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 text-[#8a8280] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      {deleting === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create / Edit form */}
          {(creating || editing) && (
            <div className="border border-[#e8e6e3] bg-[#faf9f7] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#1a1a1a]">
                  {editing ? "Edit Template" : "New Template"}
                </p>
                <button
                  onClick={cancelForm}
                  className="text-[#8a8280] hover:text-[#1a1a1a]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Label (e.g. 'Price negotiable')"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e6e3] bg-white focus:border-[#8E7A6B] focus:ring-2 focus:ring-[#8E7A6B]/10 outline-none"
              />
              <textarea
                placeholder="Message content..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-[#e8e6e3] bg-white focus:border-[#8E7A6B] focus:ring-2 focus:ring-[#8E7A6B]/10 outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={
                    saving || !formLabel.trim() || !formContent.trim()
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#8E7A6B] text-white hover:bg-[#7A6657] transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
