/**
 * Editor UI Labels - i18n Translation Keys
 *
 * This module provides translation keys and default English labels for
 * all user-facing UI text in the editor. Organized by component/feature area.
 */

// ─── Label Key Constants ─────────────────────────────────────────────────────

/**
 * Translation key constants for editor UI labels.
 * Organized by component/feature area.
 */
export const EDITOR_LABEL_KEYS = {
  // ─── Common Actions ──────────────────────────────────────────────────────
  COMMON_SAVE: 'common.save',
  COMMON_CANCEL: 'common.cancel',
  COMMON_DELETE: 'common.delete',
  COMMON_DELETING: 'common.deleting',
  COMMON_CLOSE: 'common.close',
  COMMON_RETRY: 'common.retry',
  COMMON_LOADING: 'common.loading',
  COMMON_CLEAR: 'common.clear',
  COMMON_COPY: 'common.copy',
  COMMON_COPIED: 'common.copied',
  COMMON_FIX: 'common.fix',
  COMMON_DISMISS: 'common.dismiss',
  COMMON_PUBLISH: 'common.publish',

  // ─── Sidebar / Projects ──────────────────────────────────────────────────
  SIDEBAR_PROJECTS: 'sidebar.projects',
  SIDEBAR_NEW_PROJECT: 'sidebar.new_project',
  SIDEBAR_NO_PROJECTS: 'sidebar.no_projects',
  SIDEBAR_RENAME: 'sidebar.rename',
  SIDEBAR_DELETE: 'sidebar.delete',
  SIDEBAR_EDIT_NAME: 'sidebar.edit_name',

  // ─── Time Groups ─────────────────────────────────────────────────────────
  TIME_TODAY: 'time.today',
  TIME_YESTERDAY: 'time.yesterday',
  TIME_PREVIOUS_7_DAYS: 'time.previous_7_days',
  TIME_OLDER: 'time.older',

  // ─── Delete Dialog ───────────────────────────────────────────────────────
  DELETE_TITLE: 'delete.title',
  DELETE_CONFIRM: 'delete.confirm',
  DELETE_WARNING: 'delete.warning',
  DELETE_FILES: 'delete.files',
  DELETE_CHAT: 'delete.chat',
  DELETE_SNAPSHOTS: 'delete.snapshots',
  DELETE_BUILD: 'delete.build',

  // ─── Theme Toggle ────────────────────────────────────────────────────────
  THEME_LIGHT: 'theme.light',
  THEME_DARK: 'theme.dark',
  THEME_SYSTEM: 'theme.system',
  THEME_TOGGLE: 'theme.toggle',

  // ─── Personalization Panel ───────────────────────────────────────────────
  PERSONALIZE_COLORS: 'personalize.colors',
  PERSONALIZE_FONTS: 'personalize.fonts',
  PERSONALIZE_LOGO: 'personalize.logo',
  PERSONALIZE_UPLOAD_LOGO: 'personalize.upload_logo',
  PERSONALIZE_LOGO_FORMATS: 'personalize.logo_formats',
  PERSONALIZE_GENERATE_AI: 'personalize.generate_ai',
  PERSONALIZE_AI_POWERED: 'personalize.ai_powered',
  PERSONALIZE_SKIP: 'personalize.skip',
  PERSONALIZE_LOGO_PLACEHOLDER: 'personalize.logo_placeholder',
  PERSONALIZE_UPLOADING: 'personalize.uploading',
  PERSONALIZE_GENERATING: 'personalize.generating',

  // ─── Suggested Replies ───────────────────────────────────────────────────
  SUGGESTIONS_LABEL: 'suggestions.label',
  SUGGESTIONS_SHUFFLE: 'suggestions.shuffle',
  SUGGESTIONS_CUSTOMIZE: 'suggestions.customize',

  // ─── Template Gallery ────────────────────────────────────────────────────
  TEMPLATE_PREVIEW: 'template.preview',
  TEMPLATE_UNAVAILABLE: 'template.unavailable',
  TEMPLATE_TRY_AGAIN: 'template.try_again',
  TEMPLATE_NO_TEMPLATES: 'template.no_templates',
  TEMPLATE_USE: 'template.use',
  TEMPLATE_LABEL: 'template.label',

  // ─── Palette Selector ──────────────────────────────────────────────────────
  PALETTE_RECOMMENDED: 'palette.recommended',
  PALETTE_BEST_MATCH: 'palette.best_match',
  PALETTE_TEMPLATE: 'palette.template',
  PALETTE_CUSTOM: 'palette.custom',

  // ─── Editor Views ────────────────────────────────────────────────────────
  VIEW_CODE: 'view.code',
  VIEW_SPLIT: 'view.split',
  VIEW_PREVIEW: 'view.preview',

  // ─── Preview Controls ────────────────────────────────────────────────────
  PREVIEW_START: 'preview.start',
  PREVIEW_STOP: 'preview.stop',
  PREVIEW_REFRESH: 'preview.refresh',
  PREVIEW_OPEN_TAB: 'preview.open_tab',
  PREVIEW_CLICK_START: 'preview.click_start',
  PREVIEW_FAILED: 'preview.failed',
  PREVIEW_READY: 'preview.ready',
  PREVIEW_ERROR: 'preview.error',

  // ─── Editor States ───────────────────────────────────────────────────────
  EDITOR_NO_FILES: 'editor.no_files',
  EDITOR_SELECT_FILE: 'editor.select_file',
  EDITOR_UNSAVED: 'editor.unsaved',
  EDITOR_AUTO_FIX: 'editor.auto_fix',

  // ─── Workspace Status ────────────────────────────────────────────────────
  STATUS_CREATING: 'status.creating',
  STATUS_SYNCING: 'status.syncing',
  STATUS_STARTING: 'status.starting',

  // ─── Chat Components ─────────────────────────────────────────────────────
  CHAT_UPLOAD: 'chat.upload',
  CHAT_ENHANCE: 'chat.enhance',
  CHAT_DISCUSS: 'chat.discuss',
  CHAT_WEB_SEARCH: 'chat.web_search',
  CHAT_MODEL_SETTINGS: 'chat.model_settings',
  CHAT_ENHANCED: 'chat.enhanced',
  CHAT_PLACEHOLDER: 'chat.placeholder',
  CHAT_ELEMENT_SELECTED: 'chat.element_selected',
  CHAT_COPY_CODE: 'chat.copy_code',

  // ─── Error Types ─────────────────────────────────────────────────────────
  ERROR_SYNTAX: 'error.syntax',
  ERROR_RUNTIME: 'error.runtime',
  ERROR_BUILD: 'error.build',
  ERROR_NETWORK: 'error.network',
  ERROR_PERMISSION: 'error.permission',
  ERROR_DEPENDENCY: 'error.dependency',
  ERROR_GENERIC: 'error.generic',

  // ─── Error Dialog ────────────────────────────────────────────────────────
  ERROR_PREVIEW_TITLE: 'error.preview_title',
  ERROR_TERMINAL_TITLE: 'error.terminal_title',
  ERROR_PREVIEW_MSG: 'error.preview_msg',
  ERROR_TERMINAL_MSG: 'error.terminal_msg',
  ERROR_LABEL: 'error.label',
  ERROR_COMMAND: 'error.command',
  ERROR_FILES: 'error.files',
  ERROR_STACK: 'error.stack',
  ERROR_OUTPUT: 'error.output',
  ERROR_VIEW_DETAILS: 'error.view_details',
  ERROR_HIDE_DETAILS: 'error.hide_details',
  ERROR_COPY_DETAILS: 'error.copy_details',
  ERROR_COPY_COMMAND: 'error.copy_command',
  ERROR_MORE: 'error.more',

  // ─── Design Dialog ───────────────────────────────────────────────────────
  DESIGN_TITLE: 'design.title',
  DESIGN_DESC: 'design.desc',
  DESIGN_COLORS: 'design.colors',
  DESIGN_TYPOGRAPHY: 'design.typography',
  DESIGN_FEATURES: 'design.features',
  DESIGN_STYLING: 'design.styling',
  DESIGN_PREVIEW: 'design.preview',
  DESIGN_PREVIEW_NOTE: 'design.preview_note',
  DESIGN_SAVE: 'design.save',
  DESIGN_CLOSE: 'design.close',

  // ─── Import Folder ───────────────────────────────────────────────────────
  IMPORT_FOLDER: 'import.folder',
  IMPORT_IMPORTING: 'import.importing',
  IMPORT_NO_FILES: 'import.no_files',
  IMPORT_LARGE_PROJECT: 'import.large_project',
  IMPORT_SKIP_BINARY: 'import.skip_binary',
  IMPORT_SUCCESS: 'import.success',
  IMPORT_FAILED: 'import.failed',

  // ─── Settings ────────────────────────────────────────────────────────────
  SETTINGS_TITLE: 'settings.title',

  // ─── Accessibility ───────────────────────────────────────────────────────
  A11Y_BREADCRUMBS: 'a11y.breadcrumbs',
  A11Y_CLEAR_SEARCH: 'a11y.clear_search',

  // ─── Chat Input ─────────────────────────────────────────────────────────
  CHAT_PLACEHOLDER_DESCRIBE: 'chat.placeholder_describe',
  CHAT_PLACEHOLDER_CHANGES: 'chat.placeholder_changes',
  CHAT_UPLOAD_IMAGE: 'chat.upload_image',
  CHAT_TAKE_SCREENSHOT: 'chat.take_screenshot',
  CHAT_ATTACHMENT: 'chat.attachment',

  // ─── Empty State ────────────────────────────────────────────────────────
  EMPTY_CODE_EDITOR: 'empty.code_editor',
  EMPTY_CODE_SUBTITLE: 'empty.code_subtitle',
  EMPTY_DESCRIBE_TITLE: 'empty.describe_title',
  EMPTY_DESCRIBE_SUBTITLE: 'empty.describe_subtitle',
  EMPTY_NAME_TITLE: 'empty.name_title',
  EMPTY_NAME_SUBTITLE: 'empty.name_subtitle',
  EMPTY_BUSINESS_TITLE: 'empty.business_title',
  EMPTY_BUSINESS_SUBTITLE: 'empty.business_subtitle',
  EMPTY_TEMPLATE_TITLE: 'empty.template_title',
  EMPTY_TEMPLATE_SUBTITLE: 'empty.template_subtitle',
  EMPTY_PERSONALIZE_TITLE: 'empty.personalize_title',
  EMPTY_PERSONALIZE_SUBTITLE: 'empty.personalize_subtitle',
  EMPTY_CREATING_TITLE: 'empty.creating_title',
  EMPTY_CREATING_SUBTITLE: 'empty.creating_subtitle',
  EMPTY_READY_TITLE: 'empty.ready_title',
  EMPTY_READY_SUBTITLE: 'empty.ready_subtitle',

  // ─── View Toggle ────────────────────────────────────────────────────────
  VIEW_EDITOR: 'view.editor',

  // ─── Files Panel ────────────────────────────────────────────────────────
  FILES_LABEL: 'files.label',

  // ─── Viewport Controls ──────────────────────────────────────────────────
  VIEWPORT_MOBILE: 'viewport.mobile',
  VIEWPORT_TABLET: 'viewport.tablet',
  VIEWPORT_DESKTOP: 'viewport.desktop',
  VIEWPORT_FULL_WIDTH: 'viewport.full_width',

  // ─── Status Bar ─────────────────────────────────────────────────────────
  STATUS_LIVE_PREVIEW: 'status.live_preview',

  // ─── Custom Palette Modal ──────────────────────────────────────────────
  PALETTE_CREATE_TITLE: 'palette.create_title',
  PALETTE_COLOR_PRIMARY: 'palette.color_primary',
  PALETTE_COLOR_SECONDARY: 'palette.color_secondary',
  PALETTE_COLOR_ACCENT: 'palette.color_accent',
  PALETTE_COLOR_BACKGROUND: 'palette.color_background',
  PALETTE_USE: 'palette.use',

  // ─── Font Selector ─────────────────────────────────────────────────────
  FONT_BEST_MATCH: 'font.best_match',

  // ─── File Update Card ──────────────────────────────────────────────────
  FILE_NEW: 'file.new',
  FILE_SHOW_LESS: 'file.show_less',
  FILE_SHOW_MORE: 'file.show_more',

  // ─── Creating Indicator ────────────────────────────────────────────────
  PROGRESS_COMPLETE: 'progress.complete',

  // ─── Build Timeline Steps ─────────────────────────────────────────────
  BUILD_STEP_PREPARING: 'build.step_preparing',
  BUILD_STEP_AI_CUSTOMIZING: 'build.step_ai_customizing',
  BUILD_STEP_CREATING_FILES: 'build.step_creating_files',
  BUILD_STEP_STARTING_PREVIEW: 'build.step_starting_preview',
  BUILD_STEP_PREVIEW_READY: 'build.step_preview_ready',

  // ─── Build Progress Messages ──────────────────────────────────────────
  BUILD_GETTING_READY: 'build.getting_ready',
  BUILD_COPYING_TEMPLATE: 'build.copying_template',
  BUILD_CREATING_WEBSITE: 'build.creating_website',
  BUILD_PREVIEW_READY_MSG: 'build.preview_ready_msg',
  BUILD_TEMPLATE_LOADED: 'build.template_loaded',
  BUILD_SETTING_UP: 'build.setting_up',
  BUILD_STARTING_SERVER: 'build.starting_server',
  BUILD_SITE_READY: 'build.site_ready',
  BUILD_SITE_READY_DESC: 'build.site_ready_desc',
  BUILD_BUILDING_SITE: 'build.building_site',
  BUILD_BUILDING_SITE_DESC: 'build.building_site_desc',

  // ─── Orchestration Pipeline ─────────────────────────────────────────────
  ORCH_FETCHING_PROJECT: 'orch.fetching_project',
  ORCH_PLANNER_CREATING_PLAN: 'orch.planner_creating_plan',
  ORCH_CODE_GENERATING: 'orch.code_generating',
  ORCH_CODE_REFINING: 'orch.code_refining',
  ORCH_BUILDING_SITE: 'orch.building_site',
  ORCH_FIXER_FIXING: 'orch.fixer_fixing',
  ORCH_RETRYING_BUILD: 'orch.retrying_build',
  ORCH_PLANNER_ANALYZING: 'orch.planner_analyzing',
  ORCH_BUILD_FAILED_MAX: 'orch.build_failed_max',
  ORCH_BUILD_FAILED: 'orch.build_failed',
  ORCH_PLANNER_REVIEWING: 'orch.planner_reviewing',
  ORCH_PREPARING_REFINEMENT: 'orch.preparing_refinement',
  ORCH_PUBLISHING_SITE: 'orch.publishing_site',
  ORCH_GENERATION_COMPLETE: 'orch.generation_complete',
  ORCH_CREATING_PLAN: 'orch.creating_plan',
  ORCH_GENERATING_FILES: 'orch.generating_files',
  ORCH_REFINING_SITE: 'orch.refining_site',
  ORCH_VALIDATING_FILES: 'orch.validating_files',
  ORCH_BUILDING_WITH_HEALING: 'orch.building_with_healing',
  ORCH_BUILD_FAILED_HEALING: 'orch.build_failed_healing',
  ORCH_RUNNING_REVIEW: 'orch.running_review',
  ORCH_MAX_REFINE_REACHED: 'orch.max_refine_reached',
  ORCH_REFINING_FEEDBACK: 'orch.refining_feedback',
  ORCH_PIPELINE_COMPLETE: 'orch.pipeline_complete',
  ORCH_INVALID_REVIEW: 'orch.invalid_review',
  ORCH_FAILED_PARSE_REVIEW: 'orch.failed_parse_review',
  ORCH_STARTING_PREVIEW: 'orch.starting_preview',
} as const;

export type EditorLabelKey = (typeof EDITOR_LABEL_KEYS)[keyof typeof EDITOR_LABEL_KEYS];

// ─── Default English Labels ──────────────────────────────────────────────────

/**
 * Default English labels for all editor UI text.
 * This object can be replaced with translations for i18n.
 */
export const EDITOR_LABELS: Record<EditorLabelKey, string> = {
  // Common Actions
  [EDITOR_LABEL_KEYS.COMMON_SAVE]: 'Save',
  [EDITOR_LABEL_KEYS.COMMON_CANCEL]: 'Cancel',
  [EDITOR_LABEL_KEYS.COMMON_DELETE]: 'Delete',
  [EDITOR_LABEL_KEYS.COMMON_DELETING]: 'Deleting...',
  [EDITOR_LABEL_KEYS.COMMON_CLOSE]: 'Close',
  [EDITOR_LABEL_KEYS.COMMON_RETRY]: 'Retry',
  [EDITOR_LABEL_KEYS.COMMON_LOADING]: 'Loading...',
  [EDITOR_LABEL_KEYS.COMMON_CLEAR]: 'Clear',
  [EDITOR_LABEL_KEYS.COMMON_COPY]: 'Copy',
  [EDITOR_LABEL_KEYS.COMMON_COPIED]: 'Copied!',
  [EDITOR_LABEL_KEYS.COMMON_FIX]: 'Fix',
  [EDITOR_LABEL_KEYS.COMMON_DISMISS]: 'Dismiss',
  [EDITOR_LABEL_KEYS.COMMON_PUBLISH]: 'Publish',

  // Sidebar / Projects
  [EDITOR_LABEL_KEYS.SIDEBAR_PROJECTS]: 'Projects',
  [EDITOR_LABEL_KEYS.SIDEBAR_NEW_PROJECT]: 'New Project',
  [EDITOR_LABEL_KEYS.SIDEBAR_NO_PROJECTS]: 'No projects yet',
  [EDITOR_LABEL_KEYS.SIDEBAR_RENAME]: 'Rename',
  [EDITOR_LABEL_KEYS.SIDEBAR_DELETE]: 'Delete',
  [EDITOR_LABEL_KEYS.SIDEBAR_EDIT_NAME]: 'Edit project name',

  // Time Groups
  [EDITOR_LABEL_KEYS.TIME_TODAY]: 'Today',
  [EDITOR_LABEL_KEYS.TIME_YESTERDAY]: 'Yesterday',
  [EDITOR_LABEL_KEYS.TIME_PREVIOUS_7_DAYS]: 'Previous 7 Days',
  [EDITOR_LABEL_KEYS.TIME_OLDER]: 'Older',

  // Delete Dialog
  [EDITOR_LABEL_KEYS.DELETE_TITLE]: 'Delete project?',
  [EDITOR_LABEL_KEYS.DELETE_CONFIRM]: 'Are you sure you want to delete "{{name}}"?',
  [EDITOR_LABEL_KEYS.DELETE_WARNING]: 'All project data will be deleted:',
  [EDITOR_LABEL_KEYS.DELETE_FILES]: 'All project files and code',
  [EDITOR_LABEL_KEYS.DELETE_CHAT]: 'Chat history and messages',
  [EDITOR_LABEL_KEYS.DELETE_SNAPSHOTS]: 'Snapshots and version history',
  [EDITOR_LABEL_KEYS.DELETE_BUILD]: 'Build configurations',

  // Theme Toggle
  [EDITOR_LABEL_KEYS.THEME_LIGHT]: 'Light mode',
  [EDITOR_LABEL_KEYS.THEME_DARK]: 'Dark mode',
  [EDITOR_LABEL_KEYS.THEME_SYSTEM]: 'System preference',
  [EDITOR_LABEL_KEYS.THEME_TOGGLE]: 'Toggle Theme',

  // Personalization Panel
  [EDITOR_LABEL_KEYS.PERSONALIZE_COLORS]: 'Choose Your Colors',
  [EDITOR_LABEL_KEYS.PERSONALIZE_FONTS]: 'Choose Your Fonts',
  [EDITOR_LABEL_KEYS.PERSONALIZE_LOGO]: 'Add Your Logo',
  [EDITOR_LABEL_KEYS.PERSONALIZE_UPLOAD_LOGO]: 'Upload Logo',
  [EDITOR_LABEL_KEYS.PERSONALIZE_LOGO_FORMATS]: 'PNG, JPG, or SVG (max 5MB)',
  [EDITOR_LABEL_KEYS.PERSONALIZE_GENERATE_AI]: 'Generate with AI',
  [EDITOR_LABEL_KEYS.PERSONALIZE_AI_POWERED]: 'Powered by AI',
  [EDITOR_LABEL_KEYS.PERSONALIZE_SKIP]: 'Skip for now',
  [EDITOR_LABEL_KEYS.PERSONALIZE_LOGO_PLACEHOLDER]: 'e.g., minimalist coffee cup with steam...',
  [EDITOR_LABEL_KEYS.PERSONALIZE_UPLOADING]: 'Uploading...',
  [EDITOR_LABEL_KEYS.PERSONALIZE_GENERATING]: 'Generating...',

  // Suggested Replies
  [EDITOR_LABEL_KEYS.SUGGESTIONS_LABEL]: 'Quick ideas to get you started',
  [EDITOR_LABEL_KEYS.SUGGESTIONS_SHUFFLE]: 'Show different ideas',
  [EDITOR_LABEL_KEYS.SUGGESTIONS_CUSTOMIZE]: 'Continue customizing',

  // Template Gallery
  [EDITOR_LABEL_KEYS.TEMPLATE_PREVIEW]: 'Preview template',
  [EDITOR_LABEL_KEYS.TEMPLATE_UNAVAILABLE]: 'Templates unavailable right now',
  [EDITOR_LABEL_KEYS.TEMPLATE_TRY_AGAIN]: 'Try Again',
  [EDITOR_LABEL_KEYS.TEMPLATE_NO_TEMPLATES]: 'No templates available. Please check if the template server is running.',
  [EDITOR_LABEL_KEYS.TEMPLATE_USE]: 'Use Template',
  [EDITOR_LABEL_KEYS.TEMPLATE_LABEL]: 'Template',

  // Palette Selector
  [EDITOR_LABEL_KEYS.PALETTE_RECOMMENDED]: 'Recommended',
  [EDITOR_LABEL_KEYS.PALETTE_BEST_MATCH]: 'Best Match',
  [EDITOR_LABEL_KEYS.PALETTE_TEMPLATE]: 'Template',
  [EDITOR_LABEL_KEYS.PALETTE_CUSTOM]: 'Custom',

  // Editor Views
  [EDITOR_LABEL_KEYS.VIEW_CODE]: 'Code',
  [EDITOR_LABEL_KEYS.VIEW_SPLIT]: 'Split',
  [EDITOR_LABEL_KEYS.VIEW_PREVIEW]: 'Preview',

  // Preview Controls
  [EDITOR_LABEL_KEYS.PREVIEW_START]: 'Start Preview',
  [EDITOR_LABEL_KEYS.PREVIEW_STOP]: 'Stop',
  [EDITOR_LABEL_KEYS.PREVIEW_REFRESH]: 'Refresh preview',
  [EDITOR_LABEL_KEYS.PREVIEW_OPEN_TAB]: 'Open in new tab',
  [EDITOR_LABEL_KEYS.PREVIEW_CLICK_START]: "Click 'Start Preview' to see your website",
  [EDITOR_LABEL_KEYS.PREVIEW_FAILED]: 'Failed to start preview',
  [EDITOR_LABEL_KEYS.PREVIEW_READY]: 'Preview ready',
  [EDITOR_LABEL_KEYS.PREVIEW_ERROR]: 'Error',

  // Editor States
  [EDITOR_LABEL_KEYS.EDITOR_NO_FILES]: 'No files yet',
  [EDITOR_LABEL_KEYS.EDITOR_SELECT_FILE]: 'Select a file to edit',
  [EDITOR_LABEL_KEYS.EDITOR_UNSAVED]: 'Unsaved changes',
  [EDITOR_LABEL_KEYS.EDITOR_AUTO_FIX]: 'Auto-fixing build error (attempt {{attempt}}/3)...',

  // Workspace Status
  [EDITOR_LABEL_KEYS.STATUS_CREATING]: 'Creating workspace...',
  [EDITOR_LABEL_KEYS.STATUS_SYNCING]: 'Syncing files...',
  [EDITOR_LABEL_KEYS.STATUS_STARTING]: 'Starting dev server...',

  // Chat Components
  [EDITOR_LABEL_KEYS.CHAT_UPLOAD]: 'Upload file',
  [EDITOR_LABEL_KEYS.CHAT_ENHANCE]: 'Enhance prompt',
  [EDITOR_LABEL_KEYS.CHAT_DISCUSS]: 'Discuss',
  [EDITOR_LABEL_KEYS.CHAT_WEB_SEARCH]: 'Web Search',
  [EDITOR_LABEL_KEYS.CHAT_MODEL_SETTINGS]: 'Model Settings',
  [EDITOR_LABEL_KEYS.CHAT_ENHANCED]: 'Prompt enhanced!',
  [EDITOR_LABEL_KEYS.CHAT_PLACEHOLDER]: 'Tell me about your business...',
  [EDITOR_LABEL_KEYS.CHAT_ELEMENT_SELECTED]: 'selected for inspection',
  [EDITOR_LABEL_KEYS.CHAT_COPY_CODE]: 'Copy Code',

  // Error Types
  [EDITOR_LABEL_KEYS.ERROR_SYNTAX]: 'Syntax Error',
  [EDITOR_LABEL_KEYS.ERROR_RUNTIME]: 'Runtime Error',
  [EDITOR_LABEL_KEYS.ERROR_BUILD]: 'Build Error',
  [EDITOR_LABEL_KEYS.ERROR_NETWORK]: 'Network Error',
  [EDITOR_LABEL_KEYS.ERROR_PERMISSION]: 'Permission Error',
  [EDITOR_LABEL_KEYS.ERROR_DEPENDENCY]: 'Dependency Error',
  [EDITOR_LABEL_KEYS.ERROR_GENERIC]: 'Error',

  // Error Dialog
  [EDITOR_LABEL_KEYS.ERROR_PREVIEW_TITLE]: 'Preview Error',
  [EDITOR_LABEL_KEYS.ERROR_TERMINAL_TITLE]: 'Terminal Error',
  [EDITOR_LABEL_KEYS.ERROR_PREVIEW_MSG]:
    'We encountered an error while running the preview. Would you like Flowstarter to analyze and help resolve this issue?',
  [EDITOR_LABEL_KEYS.ERROR_TERMINAL_MSG]:
    'We encountered an error while running terminal commands. Would you like Flowstarter to analyze and help resolve this issue?',
  [EDITOR_LABEL_KEYS.ERROR_LABEL]: 'Error:',
  [EDITOR_LABEL_KEYS.ERROR_COMMAND]: 'Command:',
  [EDITOR_LABEL_KEYS.ERROR_FILES]: 'Affected Files:',
  [EDITOR_LABEL_KEYS.ERROR_STACK]: 'Stack Trace:',
  [EDITOR_LABEL_KEYS.ERROR_OUTPUT]: 'Full Output:',
  [EDITOR_LABEL_KEYS.ERROR_VIEW_DETAILS]: 'View Details',
  [EDITOR_LABEL_KEYS.ERROR_HIDE_DETAILS]: 'Hide Details',
  [EDITOR_LABEL_KEYS.ERROR_COPY_DETAILS]: 'Copy error details',
  [EDITOR_LABEL_KEYS.ERROR_COPY_COMMAND]: 'Copy command',
  [EDITOR_LABEL_KEYS.ERROR_MORE]: '+{{count}} more',

  // Design Dialog
  [EDITOR_LABEL_KEYS.DESIGN_TITLE]: 'Design Palette (experimental)',
  [EDITOR_LABEL_KEYS.DESIGN_DESC]:
    'Customize your color palette, typography, and design features. These preferences will guide the AI in creating designs that match your style.',
  [EDITOR_LABEL_KEYS.DESIGN_COLORS]: 'Colors',
  [EDITOR_LABEL_KEYS.DESIGN_TYPOGRAPHY]: 'Typography',
  [EDITOR_LABEL_KEYS.DESIGN_FEATURES]: 'Features',
  [EDITOR_LABEL_KEYS.DESIGN_STYLING]: 'Styling',
  [EDITOR_LABEL_KEYS.DESIGN_PREVIEW]: 'Live Preview',
  [EDITOR_LABEL_KEYS.DESIGN_PREVIEW_NOTE]: 'Preview updates in real-time as you change settings',
  [EDITOR_LABEL_KEYS.DESIGN_SAVE]: 'Save Changes',
  [EDITOR_LABEL_KEYS.DESIGN_CLOSE]: 'Close design settings',

  // Import Folder
  [EDITOR_LABEL_KEYS.IMPORT_FOLDER]: 'Import Folder',
  [EDITOR_LABEL_KEYS.IMPORT_IMPORTING]: 'Importing...',
  [EDITOR_LABEL_KEYS.IMPORT_NO_FILES]: 'No files found in the selected folder',
  [EDITOR_LABEL_KEYS.IMPORT_LARGE_PROJECT]:
    'This folder contains {{count}} files. This product is not yet optimized for very large projects. Do you want to continue?',
  [EDITOR_LABEL_KEYS.IMPORT_SKIP_BINARY]: 'Skipping {{count}} binary files',
  [EDITOR_LABEL_KEYS.IMPORT_SUCCESS]: 'Folder imported successfully',
  [EDITOR_LABEL_KEYS.IMPORT_FAILED]: 'Failed to import folder',

  // Settings
  [EDITOR_LABEL_KEYS.SETTINGS_TITLE]: 'Settings',

  // Accessibility
  [EDITOR_LABEL_KEYS.A11Y_BREADCRUMBS]: 'Breadcrumbs',
  [EDITOR_LABEL_KEYS.A11Y_CLEAR_SEARCH]: 'Clear search',

  // Chat Input
  [EDITOR_LABEL_KEYS.CHAT_PLACEHOLDER_DESCRIBE]: 'What does your business do?',
  [EDITOR_LABEL_KEYS.CHAT_PLACEHOLDER_CHANGES]: 'Ask for changes or new ideas...',
  [EDITOR_LABEL_KEYS.CHAT_UPLOAD_IMAGE]: 'Upload Image',
  [EDITOR_LABEL_KEYS.CHAT_TAKE_SCREENSHOT]: 'Take Screenshot',
  [EDITOR_LABEL_KEYS.CHAT_ATTACHMENT]: 'Attachment',

  // Empty State
  [EDITOR_LABEL_KEYS.EMPTY_CODE_EDITOR]: 'Code Editor',
  [EDITOR_LABEL_KEYS.EMPTY_CODE_SUBTITLE]: 'Once your site generates, you can edit the code here',
  [EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_TITLE]: "Describe the client's business",
  [EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_SUBTITLE]: "Tell me about their service in the chat and I'll build a site that gets them clients",
  [EDITOR_LABEL_KEYS.EMPTY_NAME_TITLE]: 'Name your project',
  [EDITOR_LABEL_KEYS.EMPTY_NAME_SUBTITLE]: 'Give your website a memorable name',
  [EDITOR_LABEL_KEYS.EMPTY_BUSINESS_TITLE]: "Tell me about the client's business",
  [EDITOR_LABEL_KEYS.EMPTY_BUSINESS_SUBTITLE]: "Share details about their practice to personalize the site",
  [EDITOR_LABEL_KEYS.EMPTY_TEMPLATE_TITLE]: 'Pick a template',
  [EDITOR_LABEL_KEYS.EMPTY_TEMPLATE_SUBTITLE]: 'Choose a starting point and see it preview here',
  [EDITOR_LABEL_KEYS.EMPTY_PERSONALIZE_TITLE]: 'Personalize your site',
  [EDITOR_LABEL_KEYS.EMPTY_PERSONALIZE_SUBTITLE]: 'Add a logo, choose colors, and pick fonts',
  [EDITOR_LABEL_KEYS.EMPTY_CREATING_TITLE]: 'Building your site...',
  [EDITOR_LABEL_KEYS.EMPTY_CREATING_SUBTITLE]: 'Hang tight - this takes just a moment',
  [EDITOR_LABEL_KEYS.EMPTY_READY_TITLE]: 'Your site is ready!',
  [EDITOR_LABEL_KEYS.EMPTY_READY_SUBTITLE]: 'Preview loading...',

  // View Toggle
  [EDITOR_LABEL_KEYS.VIEW_EDITOR]: 'Editor',

  // Files Panel
  [EDITOR_LABEL_KEYS.FILES_LABEL]: 'Files',

  // Viewport Controls
  [EDITOR_LABEL_KEYS.VIEWPORT_MOBILE]: 'Mobile',
  [EDITOR_LABEL_KEYS.VIEWPORT_TABLET]: 'Tablet',
  [EDITOR_LABEL_KEYS.VIEWPORT_DESKTOP]: 'Desktop',
  [EDITOR_LABEL_KEYS.VIEWPORT_FULL_WIDTH]: 'Full width',

  // Status Bar
  [EDITOR_LABEL_KEYS.STATUS_LIVE_PREVIEW]: 'Live Preview',

  // Custom Palette Modal
  [EDITOR_LABEL_KEYS.PALETTE_CREATE_TITLE]: 'Create Custom Palette',
  [EDITOR_LABEL_KEYS.PALETTE_COLOR_PRIMARY]: 'Primary',
  [EDITOR_LABEL_KEYS.PALETTE_COLOR_SECONDARY]: 'Secondary',
  [EDITOR_LABEL_KEYS.PALETTE_COLOR_ACCENT]: 'Accent',
  [EDITOR_LABEL_KEYS.PALETTE_COLOR_BACKGROUND]: 'Background',
  [EDITOR_LABEL_KEYS.PALETTE_USE]: 'Use Palette',

  // Font Selector
  [EDITOR_LABEL_KEYS.FONT_BEST_MATCH]: 'Best Match',

  // File Update Card
  [EDITOR_LABEL_KEYS.FILE_NEW]: 'New',
  [EDITOR_LABEL_KEYS.FILE_SHOW_LESS]: 'Show less',
  [EDITOR_LABEL_KEYS.FILE_SHOW_MORE]: 'Show {{count}} more lines',

  // Creating Indicator
  [EDITOR_LABEL_KEYS.PROGRESS_COMPLETE]: '% complete',

  // Build Timeline Steps
  [EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING]: 'Preparing environment',
  [EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING]: 'AI customizing site',
  [EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES]: 'Creating files',
  [EDITOR_LABEL_KEYS.BUILD_STEP_STARTING_PREVIEW]: 'Starting preview',
  [EDITOR_LABEL_KEYS.BUILD_STEP_PREVIEW_READY]: 'Preview ready',

  // Build Progress Messages
  [EDITOR_LABEL_KEYS.BUILD_GETTING_READY]: 'Getting everything ready...',
  [EDITOR_LABEL_KEYS.BUILD_COPYING_TEMPLATE]: 'Copying template files...',
  [EDITOR_LABEL_KEYS.BUILD_CREATING_WEBSITE]: 'Creating your custom website...',
  [EDITOR_LABEL_KEYS.BUILD_PREVIEW_READY_MSG]: 'Getting your preview ready...',
  [EDITOR_LABEL_KEYS.BUILD_TEMPLATE_LOADED]: '**Template loaded!** Your website is almost ready.',
  [EDITOR_LABEL_KEYS.BUILD_SETTING_UP]: 'Setting up your site with the selected template.',
  [EDITOR_LABEL_KEYS.BUILD_STARTING_SERVER]: 'Starting preview server...',
  [EDITOR_LABEL_KEYS.BUILD_SITE_READY]: '**Your site is ready!**',
  [EDITOR_LABEL_KEYS.BUILD_SITE_READY_DESC]:
    "I've customized the template based on your description. You can preview it now, or ask me to make any changes.",
  [EDITOR_LABEL_KEYS.BUILD_BUILDING_SITE]: '**Building your site...**',
  [EDITOR_LABEL_KEYS.BUILD_BUILDING_SITE_DESC]: 'Setting up your custom website. This may take a moment.',

  // Orchestration Pipeline
  [EDITOR_LABEL_KEYS.ORCH_FETCHING_PROJECT]: 'Fetching project data...',
  [EDITOR_LABEL_KEYS.ORCH_PLANNER_CREATING_PLAN]: 'PlannerAgent (Opus 4.6) is creating modification plan...',
  [EDITOR_LABEL_KEYS.ORCH_CODE_GENERATING]: 'CodeGeneratorAgent (Kimi K2) is generating files...',
  [EDITOR_LABEL_KEYS.ORCH_CODE_REFINING]: 'CodeGeneratorAgent is refining (iteration {{iteration}})...',
  [EDITOR_LABEL_KEYS.ORCH_BUILDING_SITE]: 'Building site...',
  [EDITOR_LABEL_KEYS.ORCH_FIXER_FIXING]: 'FixerAgent is fixing error in {{file}}...',
  [EDITOR_LABEL_KEYS.ORCH_RETRYING_BUILD]: 'Retrying build (attempt {{attempt}})...',
  [EDITOR_LABEL_KEYS.ORCH_PLANNER_ANALYZING]: 'PlannerAgent is analyzing the situation for escalation...',
  [EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED_MAX]: 'Build failed after max fix attempts',
  [EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED]: 'Build failed',
  [EDITOR_LABEL_KEYS.ORCH_PLANNER_REVIEWING]: 'PlannerAgent (Opus 4.6) is reviewing the site...',
  [EDITOR_LABEL_KEYS.ORCH_PREPARING_REFINEMENT]: 'Preparing for refinement (iteration {{iteration}})...',
  [EDITOR_LABEL_KEYS.ORCH_PUBLISHING_SITE]: 'Publishing site...',
  [EDITOR_LABEL_KEYS.ORCH_GENERATION_COMPLETE]: 'Site generation complete!',
  [EDITOR_LABEL_KEYS.ORCH_CREATING_PLAN]: 'Creating modification plan...',
  [EDITOR_LABEL_KEYS.ORCH_GENERATING_FILES]: 'Generating site files...',
  [EDITOR_LABEL_KEYS.ORCH_REFINING_SITE]: 'Refining site (iteration {{iteration}})...',
  [EDITOR_LABEL_KEYS.ORCH_VALIDATING_FILES]: 'Validating generated files...',
  [EDITOR_LABEL_KEYS.ORCH_BUILDING_WITH_HEALING]: 'Building site with self-healing...',
  [EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED_HEALING]: 'Build failed after self-healing',
  [EDITOR_LABEL_KEYS.ORCH_RUNNING_REVIEW]: 'Running master review...',
  [EDITOR_LABEL_KEYS.ORCH_MAX_REFINE_REACHED]: 'Max refine iterations ({{max}}) reached',
  [EDITOR_LABEL_KEYS.ORCH_REFINING_FEEDBACK]: 'Refining based on review feedback (iteration {{iteration}})...',
  [EDITOR_LABEL_KEYS.ORCH_PIPELINE_COMPLETE]: 'Pipeline complete!',
  [EDITOR_LABEL_KEYS.ORCH_INVALID_REVIEW]: 'Invalid review request: {{error}}',
  [EDITOR_LABEL_KEYS.ORCH_FAILED_PARSE_REVIEW]: 'Failed to parse review response',
  [EDITOR_LABEL_KEYS.ORCH_STARTING_PREVIEW]: 'Starting preview server...',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get translated label for an editor UI key.
 * Supports template variables like {{name}} using an optional context object.
 *
 * @param key - The label key constant
 * @param context - Optional object with template variable values
 * @returns The translated label with variables substituted
 */
export function getEditorLabel(key: EditorLabelKey, context?: Record<string, string | number>): string {
  let label = EDITOR_LABELS[key] || key;

  if (context) {
    for (const [varName, value] of Object.entries(context)) {
      label = label.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), String(value));
    }
  }

  return label;
}

/**
 * Shorthand alias for getEditorLabel
 */
export const t = getEditorLabel;

