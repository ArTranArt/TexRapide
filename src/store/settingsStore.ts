import { create } from 'zustand';

interface SettingsState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light" | ((prev: "dark" | "light") => "dark" | "light")) => void;
  
  leftPanelWidth: number;
  setLeftPanelWidth: (width: number | ((prev: number) => number)) => void;
  
  topPanelHeight: number;
  setTopPanelHeight: (height: number | ((prev: number) => number)) => void;
  
  drawerHeight: number;
  setDrawerHeight: (height: number | ((prev: number) => number)) => void;
  
  fileExplorerWidth: number;
  setFileExplorerWidth: (width: number | ((prev: number) => number)) => void;
  
  pdfPosition: "right" | "bottom" | "left" | "top";
  setPdfPosition: (pos: "right" | "bottom" | "left" | "top") => void;
  
  showPdfPanel: boolean;
  setShowPdfPanel: (show: boolean | ((prev: boolean) => boolean)) => void;
  
  showFileTree: boolean;
  setShowFileTree: (show: boolean | ((prev: boolean) => boolean)) => void;
  
  editorFontSize: number;
  setEditorFontSize: (size: number | ((prev: number) => number)) => void;
  
  lineWrapping: boolean;
  setLineWrapping: (wrap: boolean | ((prev: boolean) => boolean)) => void;
  
  autoIndent: boolean;
  setAutoIndent: (indent: boolean | ((prev: boolean) => boolean)) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  theme: (localStorage.getItem("texrapide_theme") as "dark" | "light") || "dark",
  setTheme: (val) => set((state) => {
    const theme = typeof val === 'function' ? val(state.theme) : val;
    localStorage.setItem("texrapide_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    return { theme };
  }),

  leftPanelWidth: parseInt(localStorage.getItem("texrapide_left_panel_width") || "450", 10),
  setLeftPanelWidth: (val) => set((state) => {
    const width = typeof val === 'function' ? val(state.leftPanelWidth) : val;
    localStorage.setItem("texrapide_left_panel_width", width.toString());
    return { leftPanelWidth: width };
  }),

  topPanelHeight: parseInt(localStorage.getItem("texrapide_top_panel_height") || "400", 10),
  setTopPanelHeight: (val) => set((state) => {
    const height = typeof val === 'function' ? val(state.topPanelHeight) : val;
    localStorage.setItem("texrapide_top_panel_height", height.toString());
    return { topPanelHeight: height };
  }),

  drawerHeight: parseInt(localStorage.getItem("texrapide_drawer_height") || "400", 10),
  setDrawerHeight: (val) => set((state) => {
    const height = typeof val === 'function' ? val(state.drawerHeight) : val;
    localStorage.setItem("texrapide_drawer_height", height.toString());
    return { drawerHeight: height };
  }),

  fileExplorerWidth: parseInt(localStorage.getItem("texrapide_file_explorer_width") || "160", 10),
  setFileExplorerWidth: (val) => set((state) => {
    const width = typeof val === 'function' ? val(state.fileExplorerWidth) : val;
    localStorage.setItem("texrapide_file_explorer_width", width.toString());
    return { fileExplorerWidth: width };
  }),

  pdfPosition: (localStorage.getItem("texrapide_pdf_position") as "right" | "bottom" | "left" | "top") || (window.innerWidth < 850 ? "bottom" : "right"),
  setPdfPosition: (pos) => {
    localStorage.setItem("texrapide_pdf_position", pos);
    set({ pdfPosition: pos });
  },

  showPdfPanel: localStorage.getItem("texrapide_show_pdf_panel") !== "false",
  setShowPdfPanel: (val) => set((state) => {
    const show = typeof val === 'function' ? val(state.showPdfPanel) : val;
    localStorage.setItem("texrapide_show_pdf_panel", show.toString());
    return { showPdfPanel: show };
  }),

  showFileTree: true,
  setShowFileTree: (val) => set((state) => ({ showFileTree: typeof val === 'function' ? val(state.showFileTree) : val })),

  editorFontSize: parseInt(localStorage.getItem("texrapide_editor_font_size") || "13", 10),
  setEditorFontSize: (val) => set((state) => {
    const size = typeof val === 'function' ? val(state.editorFontSize) : val;
    localStorage.setItem("texrapide_editor_font_size", size.toString());
    return { editorFontSize: size };
  }),

  lineWrapping: false,
  setLineWrapping: (val) => set((state) => ({ lineWrapping: typeof val === 'function' ? val(state.lineWrapping) : val })),

  autoIndent: localStorage.getItem("texrapide_auto_indent") === "true",
  setAutoIndent: (val) => set((state) => {
    const indent = typeof val === 'function' ? val(state.autoIndent) : val;
    localStorage.setItem("texrapide_auto_indent", indent.toString());
    return { autoIndent: indent };
  }),
}));
