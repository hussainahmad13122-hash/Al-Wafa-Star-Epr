import React, { useState, useEffect } from "react";
import {
  Clipboard,
  Check,
  Trash2,
  Edit2,
  Plus,
  Search,
  X,
  Layers,
  FileText,
  Sparkles,
  Save,
  PenTool,
  Copy,
  Info,
} from "lucide-react";
import { saveStoreValue, subscribeStoreValue } from "../localDatabase";
import { AppUser } from "../types";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
}

interface CustomSpaceNotesProps {
  language: "en" | "ar" | "bn";
  loggedInUser?: AppUser | null;
}

export default function CustomSpaceNotes({ language, loggedInUser }: CustomSpaceNotesProps) {
  const isAdmin = loggedInUser?.role === "Admin";

  // Default Template Notes (Ants, Drain Flies, Rodents) - Completely in English as requested
  const defaultNotes: Note[] = [
    {
      id: "note-ants",
      title: "Ant Control Operations",
      category: "Ants",
      lastUpdated: new Date().toLocaleDateString(),
      content: `**Ant Control Operations Completed:**
- Applied specialized sanitary bait gel to infested active areas.
- Conducted a protective residual barrier spray along external structures & walls.
- Placed defensive gel baiting inside cabinet crevices & food storage zones.
- Advised client to keep the area clean, dry, and eliminate food crumbs for 7 days.`,
    },
    {
      id: "note-drainflies",
      title: "Drain Fly Control Operations",
      category: "Drain Flies",
      lastUpdated: new Date().toLocaleDateString(),
      content: `**Drain Fly Control Operations Completed:**
- Discharged bio-enzymatic drain cleaner inside floor sinks & drainpipes.
- Performed warm water flush followed by localized chemical treatment.
- Verified sticky insect traps and replaced worn-out adhesive inserts.
- Advised routine drain maintenance flushing to avoid organic matter accumulation.`,
    },
    {
      id: "note-rodents",
      title: "Rodent Control Operations",
      category: "Rodents",
      lastUpdated: new Date().toLocaleDateString(),
      content: `**Rodent Control Operations Completed:**
- Positioned secure, tamper-resistant bait stations along the outer perimeters.
- Replenished multi-catch locked stations with high-grade rodenticide blocks.
- Advised sealing gaps, pipe inlets, and entryways with structural foam or steel mesh.`,
    },
  ];

  const DEFAULT_CATEGORIES = ["Ants", "Drain Flies", "Rodents", "Custom"];

  // States
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [customCategories, setCustomCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // State for handling custom category delete / rename modals securely within sandbox
  const [catAction, setCatAction] = useState<{
    type: "delete" | "rename" | null;
    catName: string;
    inputValue?: string;
  }>({ type: null, catName: "" });

  // Subscribe to changes in store
  useEffect(() => {
    const unsubNotes = subscribeStoreValue<Note[]>(
      "custom_space_notes_v3",
      defaultNotes,
      (newNotes) => {
        setNotes(newNotes);
      }
    );

    const unsubCats = subscribeStoreValue<string[]>(
      "custom_note_categories_v3",
      DEFAULT_CATEGORIES,
      (newCats) => {
        setCustomCategories(newCats);
      }
    );

    return () => {
      unsubNotes();
      unsubCats();
    };
  }, []);

  // Helper functions to update database and trigger real-time replication
  const updateNotes = (updated: Note[]) => {
    setNotes(updated);
    saveStoreValue("custom_space_notes_v3", updated);
  };

  const updateCategories = (updatedCats: string[]) => {
    setCustomCategories(updatedCats);
    saveStoreValue("custom_note_categories_v3", updatedCats);
  };

  // Sync customCategories to include any category in existing notes automatically
  useEffect(() => {
    const noteCats = notes.map((n) => n.category);
    const uniqueCats = Array.from(new Set(noteCats)).filter(
      (c): c is string =>
        typeof c === "string" && !DEFAULT_CATEGORIES.includes(c),
    );

    const merged = Array.from(new Set([...customCategories, ...uniqueCats]));
    if (JSON.stringify(merged) !== JSON.stringify(customCategories)) {
      updateCategories(merged);
    }
  }, [notes, customCategories]);

  // Inline category add states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategorySubmit = (nameToUse?: string) => {
    const trimmed = (nameToUse || newCategoryName).trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }

    // Check if category already exists
    if (!customCategories.includes(trimmed)) {
      updateCategories([...customCategories, trimmed]);
    }

    // Automatically select the newly created category as active
    setSelectedCategory(trimmed);
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  const executeDeleteCategory = (catName: string) => {
    // Determine the best fallback category to assign notes to, avoiding the one being deleted
    const remainingCustom = customCategories.filter(c => c !== catName);
    const fallbackCategory = remainingCustom.includes("Custom") ? "Custom" : (remainingCustom[0] || "Custom");

    // Re-assign notes of this category to fallbackCategory
    const updatedNotes = notes.map((n) =>
      n.category === catName ? { ...n, category: fallbackCategory } : n,
    );
    updateNotes(updatedNotes);

    // Remove from customCategories
    const updatedCats = customCategories.filter((c) => c !== catName);
    updateCategories(updatedCats);

    // Select All or fallback
    if (selectedCategory === catName) {
      setSelectedCategory("All");
    }
    setCatAction({ type: null, catName: "" });
  };

  const executeRenameCategory = (oldCatName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (trimmed === oldCatName) {
      setCatAction({ type: null, catName: "" });
      return;
    }

    // Check if new name already exists
    const normalizedNew = trimmed.toLowerCase();
    const exists = ["all", "ants", "drain flies", "rats", "rodents", "custom", ...customCategories.map(c => c.toLowerCase())]
      .filter(c => c !== oldCatName.toLowerCase())
      .includes(normalizedNew);

    if (exists) return;

    // Rename notes of this category to the new name
    const updatedNotes = notes.map((n) =>
      n.category === oldCatName ? { ...n, category: trimmed } : n,
    );
    updateNotes(updatedNotes);

    // Update in customCategories list
    const updatedCats = customCategories.map((c) => (c === oldCatName ? trimmed : c));
    updateCategories(updatedCats);

    // If active category was this one, update selectedCategory to the new one
    if (selectedCategory === oldCatName) {
      setSelectedCategory(trimmed);
    }

    setCatAction({ type: null, catName: "" });
  };

  // Note Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("Custom");
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered Notes
  const filteredNotes = notes.filter((note) => {
    const matchesCategory =
      selectedCategory === "All" || note.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  // Handle Copy
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Handle Save (Add/Edit)
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const timestamp =
      new Date().toLocaleDateString() +
      " " +
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let finalCategory = formCategory;
    if (formCategory === "other") {
      const trimmed = customCategoryInput.trim();
      finalCategory = trimmed ? trimmed : "Custom";

      // Auto-add to customCategories list if it's not already there
      if (trimmed && !customCategories.includes(trimmed)) {
        updateCategories([...customCategories, trimmed]);
      }
    }

    if (editingNote) {
      // Edit mode
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: formTitle.trim(),
              content: formContent,
              category: finalCategory,
              lastUpdated: timestamp,
            }
          : n,
      );
      updateNotes(updatedNotes);
    } else {
      // Add mode
      const newNote: Note = {
        id: `note-custom-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent,
        category: finalCategory,
        lastUpdated: timestamp,
      };
      updateNotes([...notes, newNote]);
    }

    closeModal();
  };

  // Open Modal for Create
  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");

    // Set to currently selected category as smart UX default, fallback to Custom
    const defaultCat = selectedCategory === "All" ? "Custom" : selectedCategory;
    setFormCategory(defaultCat);
    setCustomCategoryInput("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setCustomCategoryInput("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  // Delete Note
  const handleDeleteNote = (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      updateNotes(notes.filter((n) => n.id !== id));
    }
  };

  // Quick reset to default templates if user deletes them and wants them back
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        "This will restore the original English templates for Ants, Drain Flies, and Rodents, while preserving your other custom notes. Proceed?",
      )
    ) {
      const customNotes = notes.filter(
        (n) =>
          !n.id.startsWith("note-ants") &&
          !n.id.startsWith("note-drainflies") &&
          !n.id.startsWith("note-rodents"),
      );
      updateNotes([...defaultNotes, ...customNotes]);

      // Also restore default categories if deleted
      const updatedCats = Array.from(new Set([...customCategories, "Ants", "Drain Flies", "Rodents"]));
      updateCategories(updatedCats);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-100">
      {/* Admin Notice for Non-Admins */}
      {!isAdmin && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3 text-blue-400">
          <Info className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">
            {language === "bn"
              ? "শুধুমাত্র দেখার মোড: অ্যাডমিনরা নতুন কাস্টম নোট তৈরি করতে বা ক্যাটাগরি এডিট/ডিলিট করতে পারেন। আপনি এখানে যেকোন নোট কপি করতে পারবেন।"
              : language === "ar"
                ? "وضع العرض فقط: يمكن للمسؤولين فقط إنشاء ملاحظات مخصصة جديدة أو تعديل الفئات. يمكنك نسخ الملاحظات هنا."
                : "View-Only Mode: Only Admins can create/edit notes or manage categories. You are free to copy any notes."}
          </div>
        </div>
      )}

      {/* Title & Stats Ribbon */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <span>Pest Control Custom Notes Hub</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              A professional English hub to manage, save, edit, and instantly
              copy custom service reports and checklists.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-slate-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Note</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-700/80 transition-all cursor-pointer"
              title="Reset Default English Templates"
            >
              Reset Templates
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {[
            { id: "All", label: "All Notes" },
            ...customCategories.map((cat) => ({ id: cat, label: cat })),
          ]
            .reduce(
              (acc, current) => {
                if (!acc.some((item) => item.id === current.id)) {
                  acc.push(current);
                }
                return acc;
              },
              [] as { id: string; label: string }[],
            )
            .map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center bg-slate-800/40 rounded-xl p-1 border border-slate-800/40 hover:border-slate-700/60 transition-all gap-1"
              >
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>

                {/* Optional inline edit and deletion of custom category tabs */}
                {isAdmin && cat.id !== "All" && (
                  <div className="hidden group-hover:flex items-center gap-0.5 pr-0.5 shrink-0">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCatAction({
                          type: "rename",
                          catName: cat.id,
                          inputValue: cat.id
                        });
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-md bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-400 transition-all cursor-pointer shrink-0"
                      title={language === "bn" ? "নাম পরিবর্তন করুন" : "Rename category"}
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCatAction({
                          type: "delete",
                          catName: cat.id
                        });
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-all cursor-pointer shrink-0"
                      title={language === "bn" ? "ডিলিট করুন" : "Delete category"}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

          {/* Inline Add Category Tab Form */}
          {isAddingCategory ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategorySubmit();
              }}
              className="flex items-center gap-1 bg-slate-950 border border-indigo-500/50 rounded-xl p-1 transition-all animate-fade-in"
            >
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Bed Bugs"
                className="bg-transparent text-xs text-slate-200 px-2 py-1 outline-none w-28 font-sans"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName("");
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-md"
              title="Add custom category tab"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tab</span>
            </button>
          )}
        </div>

        {/* Note Counter */}
        <div className="md:ml-auto shrink-0 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider font-mono">
            {filteredNotes.length} Notes Filtered
          </span>
        </div>
      </div>

      {/* Grid of Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => {
          const charCount = note.content.length;

          return (
            <div
              key={note.id}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 group relative"
            >
              {/* Category Badge top-right */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                    note.category === "Ants"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : note.category === "Drain Flies"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : note.category === "Rodents"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  {note.category === "Ants"
                    ? "Ants"
                    : note.category === "Drain Flies"
                      ? "Drain Flies"
                      : note.category === "Rodents"
                        ? "Rodent"
                        : note.category}
                </span>
              </div>

              {/* Note Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <h3 className="text-[13px] font-extrabold text-slate-100 pr-16 truncate leading-snug">
                    {note.title}
                  </h3>
                </div>

                {/* Dynamic Height Note Content Box - Shows ALL text, never scrollbar */}
                <div className="relative mt-2">
                  <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-[11.5px] text-slate-300 font-medium font-sans whitespace-pre-wrap leading-relaxed outline-none min-h-[100px] break-words">
                    {note.content}
                  </div>
                </div>
              </div>

              {/* Note Footer - Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-semibold">
                    Updated: {note.lastUpdated}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {charCount} characters
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyText(note.id, note.content)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                      copiedId === note.id
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-indigo-600/15 hover:bg-indigo-600 hover:text-white text-indigo-400 border border-indigo-600/25 active:scale-95"
                    }`}
                  >
                    {copiedId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditModal(note)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800 rounded-full text-slate-400 text-lg">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-300">
                No Notes Found
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try clearing your search query or add a brand new custom note
                directly using the button above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-sm text-slate-100">
                  {editingNote ? "Edit Pest Note" : "Create New Pest Note"}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Note Category
                </label>

                {/* Grid layout of all existing categories so they can click to select easily */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950/40 rounded-xl border border-slate-800">
                  {[
                    { id: "Ants", label: "Ants" },
                    { id: "Drain Flies", label: "Flies" },
                    { id: "Rodents", label: "Rodents" },
                    { id: "Custom", label: "Custom" },
                    ...customCategories
                      .filter(
                        (c) =>
                          !["Ants", "Drain Flies", "Rodents", "Custom"].includes(
                            c,
                          ),
                      )
                      .map((cat) => ({ id: cat, label: cat })),
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormCategory(cat.id);
                        setCustomCategoryInput("");
                      }}
                      className={`py-1.5 px-2.5 text-center text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                        formCategory === cat.id
                          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500"
                          : "bg-slate-950 text-slate-500 border-slate-850 hover:border-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}

                  {/* Option to specify a new category on the fly */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory("other");
                      setCustomCategoryInput("");
                    }}
                    className={`py-1.5 px-2.5 text-center text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                      formCategory === "other"
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500"
                        : "bg-slate-950 text-indigo-400 border-slate-850 hover:border-slate-700 border-dashed"
                    }`}
                  >
                    {language === "bn" ? "+ নতুন ক্যাটাগরি" : language === "ar" ? "+ فئة جديدة" : "+ New Category"}
                  </button>
                </div>

                {/* If "other" or "Custom" is selected, or if they want to override the input, show text box */}
                {(formCategory === "other" ||
                  formCategory === "Custom" ||
                  !["Ants", "Drain Flies", "Rodents", "Custom"].includes(
                    formCategory,
                  )) && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === "bn" ? "ক্যাটাগরির নাম / টাইপ করুন" : language === "ar" ? "اسم الفئة" : "Category Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={
                        formCategory === "other"
                          ? customCategoryInput
                          : formCategory
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (formCategory === "other") {
                          setCustomCategoryInput(val);
                        } else {
                          // Allow renaming category on this note directly
                          setFormCategory(val);
                        }
                      }}
                      placeholder="e.g. Bed Bugs, Cockroaches, Termite..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
                    />
                    <p className="text-[9px] text-slate-500">
                      Enter the category name (e.g. Bed Bugs). It will
                      automatically add a filter tab.
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Ant Treatment Checklist"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Description Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Note Content / Text
                </label>
                <textarea
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Type or paste your pest control text here..."
                  className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans resize-none leading-relaxed"
                />
                <p className="text-[9px] text-slate-500 font-semibold text-right">
                  {formContent.length} characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/80 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Action Modal (Delete / Rename) */}
      {catAction.type !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                {catAction.type === "rename" ? (
                  <>
                    <Edit2 className="w-4 h-4 text-indigo-400" />
                    <span>{language === "bn" ? "ক্যাটাগরি সম্পাদনা" : "Rename Category"}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>{language === "bn" ? "ক্যাটাগরি ডিলিট" : "Delete Category"}</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setCatAction({ type: null, catName: "" })}
                className="p-1.5 rounded-xl bg-slate-850/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catAction.type === "rename" ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  {language === "bn"
                    ? `"${catAction.catName}" ক্যাটাগরির জন্য একটি নতুন নাম লিখুন:`
                    : `Enter a new name for the category "${catAction.catName}":`}
                </p>
                <input
                  type="text"
                  value={catAction.inputValue || ""}
                  onChange={(e) =>
                    setCatAction((prev) => ({ ...prev, inputValue: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
                  placeholder={language === "bn" ? "যেমন: বেড বাগস" : "e.g. Bed Bugs"}
                  autoFocus
                />
                
                {/* Check if exists error */}
                {catAction.inputValue && 
                 catAction.inputValue.trim().toLowerCase() !== catAction.catName.toLowerCase() &&
                 ["all", "ants", "drain flies", "rats", "rodents", "custom", ...customCategories.map(c => c.toLowerCase())].includes(catAction.inputValue.trim().toLowerCase()) && (
                  <p className="text-xs text-rose-500 font-medium">
                    {language === "bn" ? "এই ক্যাটাগরি ইতিমধ্যে বিদ্যমান!" : "This category already exists!"}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCatAction({ type: null, catName: "" })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/80 transition-all cursor-pointer"
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !catAction.inputValue?.trim() ||
                      (catAction.inputValue.trim().toLowerCase() !== catAction.catName.toLowerCase() &&
                       ["all", "ants", "drain flies", "rats", "rodents", "custom", ...customCategories.map(c => c.toLowerCase())].includes(catAction.inputValue.trim().toLowerCase()))
                    }
                    onClick={() => executeRenameCategory(catAction.catName, catAction.inputValue || "")}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
                  >
                    {language === "bn" ? "সংরক্ষণ" : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === "bn"
                    ? `আপনি কি নিশ্চিত যে আপনি "${catAction.catName}" ক্যাটাগরি ডিলিট করতে চান? এই ক্যাটাগরির সকল নোট "Custom" ক্যাটাগরিতে স্থানান্তরিত হবে।`
                    : `Are you sure you want to delete the category "${catAction.catName}"? Any notes under this category will be re-assigned to "Custom".`}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCatAction({ type: null, catName: "" })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/80 transition-all cursor-pointer"
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteCategory(catAction.catName)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                  >
                    {language === "bn" ? "ডিলিট করুন" : "Delete Category"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
