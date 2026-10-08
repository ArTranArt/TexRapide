import { create } from 'zustand';

interface EditorState {
  editingFile: string;
  editorContent: string;
  hasUnsavedChanges: boolean;
  setEditingFile: (file: string) => void;
  setEditorContent: (content: string) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  editingFile: "",
  editorContent: "",
  hasUnsavedChanges: false,
  setEditingFile: (file) => set({ editingFile: file }),
  setEditorContent: (content) => set({ editorContent: content }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
}));
