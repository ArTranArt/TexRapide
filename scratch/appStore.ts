import { create } from 'zustand';

interface HealthStatus {
  binary: String;
  installed: boolean;
  version: string | null;
}interface Project {
  name: string;
  last_modified: number;
}interface FileEntry {
  name: string;
  relative_path: string;
  is_dir: boolean;
  children?: FileEntry[];
}interface Shortcut {
    key: string;
    code: string;
  }

export interface AppState {
  view: "dashboard" | "settings" | "project" | "help";
  setView: (val: "dashboard" | "settings" | "project" | "help" | ((prev: "dashboard" | "settings" | "project" | "help") => "dashboard" | "settings" | "project" | "help")) => void;
  helpTab: "basics" | "text" | "math" | "media";
  setHelpTab: (val: "basics" | "text" | "math" | "media" | ((prev: "basics" | "text" | "math" | "media") => "basics" | "text" | "math" | "media")) => void;
  copiedId: string | null;
  setCopiedId: (val: string | null | ((prev: string | null) => string | null)) => void;
  lineWrapping: boolean;
  setLineWrapping: (val: boolean | ((prev: boolean) => boolean)) => void;
  showFileTree: boolean;
  setShowFileTree: (val: boolean | ((prev: boolean) => boolean)) => void;
  projectTree: FileEntry[];
  setProjectTree: (val: FileEntry[] | ((prev: FileEntry[]) => FileEntry[])) => void;
  isCreatingFile: boolean;
  setIsCreatingFile: (val: boolean | ((prev: boolean) => boolean)) => void;
  newFileName: string;
  setNewFileName: (val: string | ((prev: string) => string)) => void;
  theme: "dark" | "light";
  setTheme: (val: "dark" | "light" | ((prev: "dark" | "light") => "dark" | "light")) => void;
  compilationEngine: "system" | "tectonic";
  setCompilationEngine: (val: "system" | "tectonic" | ((prev: "system" | "tectonic") => "system" | "tectonic")) => void;
  health: HealthStatus[];
  setHealth: (val: HealthStatus[] | ((prev: HealthStatus[]) => HealthStatus[])) => void;
  analysisStep: number;
  setAnalysisStep: (val: number | ((prev: number) => number)) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean | ((prev: boolean) => boolean)) => void;
  hoveredNode: "distribution" | "cli" | "skim" | null;
  setHoveredNode: (val: "distribution" | "cli" | "skim" | null | ((prev: "distribution" | "cli" | "skim" | null) => "distribution" | "cli" | "skim" | null)) => void;
  selectedNode: "distribution" | "cli" | "skim" | null;
  setSelectedNode: (val: "distribution" | "cli" | "skim" | null | ((prev: "distribution" | "cli" | "skim" | null) => "distribution" | "cli" | "skim" | null)) => void;
  projectName: string;
  setProjectName: (val: string | ((prev: string) => string)) => void;
  newProjectName: string;
  setNewProjectName: (val: string | ((prev: string) => string)) => void;
  mainFile: any;
  setMainFile: (val: any | ((prev: any) => any)) => void;
  targetDir: any;
  setTargetDir: (val: any | ((prev: any) => any)) => void;
  dashboardProjectsDir: any;
  setDashboardProjectsDir: (val: any | ((prev: any) => any)) => void;
  templateDir: any;
  setTemplateDir: (val: any | ((prev: any) => any)) => void;
  availableTemplates: string[];
  setAvailableTemplates: (val: string[] | ((prev: string[]) => string[])) => void;
  selectedTemplate: string;
  setSelectedTemplate: (val: string | ((prev: string) => string)) => void;
  existingProjects: Project[];
  setExistingProjects: (val: Project[] | ((prev: Project[]) => Project[])) => void;
  activeProject: string | null;
  setActiveProject: (val: string | null | ((prev: string | null) => string | null)) => void;
  projectTexFiles: string[];
  setProjectTexFiles: (val: string[] | ((prev: string[]) => string[])) => void;
  unfilteredTexCount: number;
  setUnfilteredTexCount: (val: number | ((prev: number) => number)) => void;
  floatingPos: "left" | "right";
  setFloatingPos: (val: "left" | "right" | ((prev: "left" | "right") => "left" | "right")) => void;
  floatingDragOffset: number;
  setFloatingDragOffset: (val: number | ((prev: number) => number)) => void;
  isFloatingCollapsed: boolean;
  setIsFloatingCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  isWatching: boolean;
  setIsWatching: (val: boolean | ((prev: boolean) => boolean)) => void;
  fileExplorerWidth: any;
  setFileExplorerWidth: (val: any | ((prev: any) => any)) => void;
  sortBy: "recent" | "alphabetical";
  setSortBy: (val: "recent" | "alphabetical" | ((prev: "recent" | "alphabetical") => "recent" | "alphabetical")) => void;
  searchQuery: string;
  setSearchQuery: (val: string | ((prev: string) => string)) => void;
  isCreatingInline: boolean;
  setIsCreatingInline: (val: boolean | ((prev: boolean) => boolean)) => void;
  compileStatus: "idle" | "compiling" | "success" | "error";
  setCompileStatus: (val: "idle" | "compiling" | "success" | "error" | ((prev: "idle" | "compiling" | "success" | "error") => "idle" | "compiling" | "success" | "error")) => void;
  compileLogs: string;
  setCompileLogs: (val: string | ((prev: string) => string)) => void;
  isLogsOpen: boolean;
  setIsLogsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeOsTab: "mac" | "windows" | "linux";
  setActiveOsTab: (val: "mac" | "windows" | "linux" | ((prev: "mac" | "windows" | "linux") => "mac" | "windows" | "linux")) => void;
  drawerHeight: any;
  setDrawerHeight: (val: any | ((prev: any) => any)) => void;
  pdfViewerMode: "integrated" | "system";
  setPdfViewerMode: (val: "integrated" | "system" | ((prev: "integrated" | "system") => "integrated" | "system")) => void;
  pdfExists: boolean;
  setPdfExists: (val: boolean | ((prev: boolean) => boolean)) => void;
  editingFile: string;
  setEditingFile: (val: string | ((prev: string) => string)) => void;
  editorContent: string;
  setEditorContent: (val: string | ((prev: string) => string)) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean | ((prev: boolean) => boolean)) => void;
  leftPanelWidth: any;
  setLeftPanelWidth: (val: any | ((prev: any) => any)) => void;
  topPanelHeight: number;
  setTopPanelHeight: (val: number | ((prev: number) => number)) => void;
  pdfPosition: "right" | "bottom" | "left" | "top";
  setPdfPosition: (val: "right" | "bottom" | "left" | "top" | ((prev: "right" | "bottom" | "left" | "top") => "right" | "bottom" | "left" | "top")) => void;
  showPdfPanel: boolean;
  setShowPdfPanel: (val: boolean | ((prev: boolean) => boolean)) => void;
  editorFontSize: number;
  setEditorFontSize: (val: number | ((prev: number) => number)) => void;
  pendingHighlightLine: number | null;
  setPendingHighlightLine: (val: number | null | ((prev: number | null) => number | null)) => void;
  forwardSearchRipple: { page: number; x: number; y: number; timestamp: number } | null;
  setForwardSearchRipple: (val: { page: number; x: number; y: number; timestamp: number } | null | ((prev: { page: number; x: number; y: number; timestamp: number } | null) => { page: number; x: number; y: number; timestamp: number } | null)) => void;
  zoomInKey: Shortcut | null;
  setZoomInKey: (val: Shortcut | null | ((prev: Shortcut | null) => Shortcut | null)) => void;
  zoomOutKey: Shortcut | null;
  setZoomOutKey: (val: Shortcut | null | ((prev: Shortcut | null) => Shortcut | null)) => void;
  commentKey: Shortcut | null;
  setCommentKey: (val: Shortcut | null | ((prev: Shortcut | null) => Shortcut | null)) => void;
  recordingField: "zoomIn" | "zoomOut" | "comment" | null;
  setRecordingField: (val: "zoomIn" | "zoomOut" | "comment" | null | ((prev: "zoomIn" | "zoomOut" | "comment" | null) => "zoomIn" | "zoomOut" | "comment" | null)) => void;
  autoIndent: boolean;
  setAutoIndent: (val: boolean | ((prev: boolean) => boolean)) => void;
  ignoredPatterns: string[];
  setIgnoredPatterns: (val: string[] | ((prev: string[]) => string[])) => void;
  newPattern: string;
  setNewPattern: (val: string | ((prev: string) => string)) => void;
  contextMenu: { x: number, y: number, entry: FileEntry } | null;
  setContextMenu: (val: { x: number, y: number, entry: FileEntry } | null | ((prev: { x: number, y: number, entry: FileEntry } | null) => { x: number, y: number, entry: FileEntry } | null)) => void;
  renamingPath: string | null;
  setRenamingPath: (val: string | null | ((prev: string | null) => string | null)) => void;
  renamingValue: string;
  setRenamingValue: (val: string | ((prev: string) => string)) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: "dashboard",
  setView: (val) => set((state) => ({ view: typeof val === 'function' ? (val as any)(state.view) : val })),
  helpTab: "basics",
  setHelpTab: (val) => set((state) => ({ helpTab: typeof val === 'function' ? (val as any)(state.helpTab) : val })),
  copiedId: null,
  setCopiedId: (val) => set((state) => ({ copiedId: typeof val === 'function' ? (val as any)(state.copiedId) : val })),
  lineWrapping: false,
  setLineWrapping: (val) => set((state) => ({ lineWrapping: typeof val === 'function' ? (val as any)(state.lineWrapping) : val })),
  showFileTree: true,
  setShowFileTree: (val) => set((state) => ({ showFileTree: typeof val === 'function' ? (val as any)(state.showFileTree) : val })),
  projectTree: [],
  setProjectTree: (val) => set((state) => ({ projectTree: typeof val === 'function' ? (val as any)(state.projectTree) : val })),
  isCreatingFile: false,
  setIsCreatingFile: (val) => set((state) => ({ isCreatingFile: typeof val === 'function' ? (val as any)(state.isCreatingFile) : val })),
  newFileName: "",
  setNewFileName: (val) => set((state) => ({ newFileName: typeof val === 'function' ? (val as any)(state.newFileName) : val })),
  theme: ( () => {
    const saved = localStorage.getItem("texrapide_theme" )(),
  setTheme: (val) => set((state) => ({ theme: typeof val === 'function' ? (val as any)(state.theme) : val })),
  compilationEngine: ( () => {
    const saved = localStorage.getItem("texrapide_compilation_engine" )(),
  setCompilationEngine: (val) => set((state) => ({ compilationEngine: typeof val === 'function' ? (val as any)(state.compilationEngine) : val })),
  health: [],
  setHealth: (val) => set((state) => ({ health: typeof val === 'function' ? (val as any)(state.health) : val })),
  analysisStep: 3,
  setAnalysisStep: (val) => set((state) => ({ analysisStep: typeof val === 'function' ? (val as any)(state.analysisStep) : val })),
  isAnalyzing: false,
  setIsAnalyzing: (val) => set((state) => ({ isAnalyzing: typeof val === 'function' ? (val as any)(state.isAnalyzing) : val })),
  hoveredNode: null,
  setHoveredNode: (val) => set((state) => ({ hoveredNode: typeof val === 'function' ? (val as any)(state.hoveredNode) : val })),
  selectedNode: null,
  setSelectedNode: (val) => set((state) => ({ selectedNode: typeof val === 'function' ? (val as any)(state.selectedNode) : val })),
  projectName: "",
  setProjectName: (val) => set((state) => ({ projectName: typeof val === 'function' ? (val as any)(state.projectName) : val })),
  newProjectName: "",
  setNewProjectName: (val) => set((state) => ({ newProjectName: typeof val === 'function' ? (val as any)(state.newProjectName) : val })),
  mainFile: "main.tex",
  setMainFile: (val) => set((state) => ({ mainFile: typeof val === 'function' ? (val as any)(state.mainFile) : val })),
  targetDir: ( () => localStorage.getItem("texrapide_target_dir") || "" )(),
  setTargetDir: (val) => set((state) => ({ targetDir: typeof val === 'function' ? (val as any)(state.targetDir) : val })),
  dashboardProjectsDir: ( () => localStorage.getItem("texrapide_dashboard_dir") || localStorage.getItem("texrapide_target_dir") || "" )(),
  setDashboardProjectsDir: (val) => set((state) => ({ dashboardProjectsDir: typeof val === 'function' ? (val as any)(state.dashboardProjectsDir) : val })),
  templateDir: ( () => localStorage.getItem("texrapide_template_dir") || "" )(),
  setTemplateDir: (val) => set((state) => ({ templateDir: typeof val === 'function' ? (val as any)(state.templateDir) : val })),
  availableTemplates: [],
  setAvailableTemplates: (val) => set((state) => ({ availableTemplates: typeof val === 'function' ? (val as any)(state.availableTemplates) : val })),
  selectedTemplate: "",
  setSelectedTemplate: (val) => set((state) => ({ selectedTemplate: typeof val === 'function' ? (val as any)(state.selectedTemplate) : val })),
  existingProjects: [],
  setExistingProjects: (val) => set((state) => ({ existingProjects: typeof val === 'function' ? (val as any)(state.existingProjects) : val })),
  activeProject: null,
  setActiveProject: (val) => set((state) => ({ activeProject: typeof val === 'function' ? (val as any)(state.activeProject) : val })),
  projectTexFiles: [],
  setProjectTexFiles: (val) => set((state) => ({ projectTexFiles: typeof val === 'function' ? (val as any)(state.projectTexFiles) : val })),
  unfilteredTexCount: 0,
  setUnfilteredTexCount: (val) => set((state) => ({ unfilteredTexCount: typeof val === 'function' ? (val as any)(state.unfilteredTexCount) : val })),
  floatingPos: "right",
  setFloatingPos: (val) => set((state) => ({ floatingPos: typeof val === 'function' ? (val as any)(state.floatingPos) : val })),
  floatingDragOffset: 0,
  setFloatingDragOffset: (val) => set((state) => ({ floatingDragOffset: typeof val === 'function' ? (val as any)(state.floatingDragOffset) : val })),
  isFloatingCollapsed: false,
  setIsFloatingCollapsed: (val) => set((state) => ({ isFloatingCollapsed: typeof val === 'function' ? (val as any)(state.isFloatingCollapsed) : val })),
  isWatching: false,
  setIsWatching: (val) => set((state) => ({ isWatching: typeof val === 'function' ? (val as any)(state.isWatching) : val })),
  fileExplorerWidth: ( () => {
    const saved = localStorage.getItem("texrapide_file_explorer_width" )(),
  setFileExplorerWidth: (val) => set((state) => ({ fileExplorerWidth: typeof val === 'function' ? (val as any)(state.fileExplorerWidth) : val })),
  sortBy: "recent",
  setSortBy: (val) => set((state) => ({ sortBy: typeof val === 'function' ? (val as any)(state.sortBy) : val })),
  searchQuery: "",
  setSearchQuery: (val) => set((state) => ({ searchQuery: typeof val === 'function' ? (val as any)(state.searchQuery) : val })),
  isCreatingInline: false,
  setIsCreatingInline: (val) => set((state) => ({ isCreatingInline: typeof val === 'function' ? (val as any)(state.isCreatingInline) : val })),
  compileStatus: "idle",
  setCompileStatus: (val) => set((state) => ({ compileStatus: typeof val === 'function' ? (val as any)(state.compileStatus) : val })),
  compileLogs: "",
  setCompileLogs: (val) => set((state) => ({ compileLogs: typeof val === 'function' ? (val as any)(state.compileLogs) : val })),
  isLogsOpen: false,
  setIsLogsOpen: (val) => set((state) => ({ isLogsOpen: typeof val === 'function' ? (val as any)(state.isLogsOpen) : val })),
  activeOsTab: () => {
    if (navigator.userAgent.indexOf("Win") !== -1) return "windows";
    if (navigator.userAgent.indexOf("Linux") !== -1) return "linux";
    return "mac";
  },
  setActiveOsTab: (val) => set((state) => ({ activeOsTab: typeof val === 'function' ? (val as any)(state.activeOsTab) : val })),
  drawerHeight: ( () => {
    const saved = localStorage.getItem("texrapide_drawer_height" )(),
  setDrawerHeight: (val) => set((state) => ({ drawerHeight: typeof val === 'function' ? (val as any)(state.drawerHeight) : val })),
  pdfViewerMode: ( () => {
    const saved = localStorage.getItem("texrapide_pdf_viewer_mode" )(),
  setPdfViewerMode: (val) => set((state) => ({ pdfViewerMode: typeof val === 'function' ? (val as any)(state.pdfViewerMode) : val })),
  pdfExists: false,
  setPdfExists: (val) => set((state) => ({ pdfExists: typeof val === 'function' ? (val as any)(state.pdfExists) : val })),
  editingFile: "",
  setEditingFile: (val) => set((state) => ({ editingFile: typeof val === 'function' ? (val as any)(state.editingFile) : val })),
  editorContent: "",
  setEditorContent: (val) => set((state) => ({ editorContent: typeof val === 'function' ? (val as any)(state.editorContent) : val })),
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set((state) => ({ hasUnsavedChanges: typeof val === 'function' ? (val as any)(state.hasUnsavedChanges) : val })),
  leftPanelWidth: ( () => {
    const saved = localStorage.getItem("texrapide_left_panel_width" )(),
  setLeftPanelWidth: (val) => set((state) => ({ leftPanelWidth: typeof val === 'function' ? (val as any)(state.leftPanelWidth) : val })),
  topPanelHeight: ( () => {
    const saved = localStorage.getItem("texrapide_top_panel_height" )(),
  setTopPanelHeight: (val) => set((state) => ({ topPanelHeight: typeof val === 'function' ? (val as any)(state.topPanelHeight) : val })),
  pdfPosition: ( () => {
    const saved = localStorage.getItem("texrapide_pdf_position" )(),
  setPdfPosition: (val) => set((state) => ({ pdfPosition: typeof val === 'function' ? (val as any)(state.pdfPosition) : val })),
  showPdfPanel: ( () => {
    const saved = localStorage.getItem("texrapide_show_pdf_panel" )(),
  setShowPdfPanel: (val) => set((state) => ({ showPdfPanel: typeof val === 'function' ? (val as any)(state.showPdfPanel) : val })),
  editorFontSize: ( () => {
    const saved = localStorage.getItem("texrapide_editor_font_size" )(),
  setEditorFontSize: (val) => set((state) => ({ editorFontSize: typeof val === 'function' ? (val as any)(state.editorFontSize) : val })),
  pendingHighlightLine: null,
  setPendingHighlightLine: (val) => set((state) => ({ pendingHighlightLine: typeof val === 'function' ? (val as any)(state.pendingHighlightLine) : val })),
  forwardSearchRipple: null,
  setForwardSearchRipple: (val) => set((state) => ({ forwardSearchRipple: typeof val === 'function' ? (val as any)(state.forwardSearchRipple) : val })),
  zoomInKey: ( () => {
    return parseShortcut(localStorage.getItem("texrapide_zoom_in_shortcut") )(),
  setZoomInKey: (val) => set((state) => ({ zoomInKey: typeof val === 'function' ? (val as any)(state.zoomInKey) : val })),
  zoomOutKey: ( () => {
    return parseShortcut(localStorage.getItem("texrapide_zoom_out_shortcut") )(),
  setZoomOutKey: (val) => set((state) => ({ zoomOutKey: typeof val === 'function' ? (val as any)(state.zoomOutKey) : val })),
  commentKey: ( () => {
    return parseShortcut(localStorage.getItem("texrapide_comment_shortcut") )(),
  setCommentKey: (val) => set((state) => ({ commentKey: typeof val === 'function' ? (val as any)(state.commentKey) : val })),
  recordingField: null,
  setRecordingField: (val) => set((state) => ({ recordingField: typeof val === 'function' ? (val as any)(state.recordingField) : val })),
  autoIndent: ( () => {
    const saved = localStorage.getItem("texrapide_auto_indent" )(),
  setAutoIndent: (val) => set((state) => ({ autoIndent: typeof val === 'function' ? (val as any)(state.autoIndent) : val })),
  ignoredPatterns: ( () => {
    const saved = localStorage.getItem("texrapide_ignored" )(),
  setIgnoredPatterns: (val) => set((state) => ({ ignoredPatterns: typeof val === 'function' ? (val as any)(state.ignoredPatterns) : val })),
  newPattern: "",
  setNewPattern: (val) => set((state) => ({ newPattern: typeof val === 'function' ? (val as any)(state.newPattern) : val })),
  contextMenu: null,
  setContextMenu: (val) => set((state) => ({ contextMenu: typeof val === 'function' ? (val as any)(state.contextMenu) : val })),
  renamingPath: null,
  setRenamingPath: (val) => set((state) => ({ renamingPath: typeof val === 'function' ? (val as any)(state.renamingPath) : val })),
  renamingValue: "",
  setRenamingValue: (val) => set((state) => ({ renamingValue: typeof val === 'function' ? (val as any)(state.renamingValue) : val })),
}));
