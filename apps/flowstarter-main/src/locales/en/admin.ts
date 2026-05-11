export const adminKeys = {
  // Sidebar
  'admin.sidebar.section.operations': 'Operations',
  'admin.sidebar.section.infrastructure': 'Infrastructure',
  'admin.sidebar.section.insights': 'Insights',
  'admin.sidebar.section.workspace': 'Workspace',
  'admin.nav.workspaces': 'Workspaces',
  'admin.nav.accounts': 'Accounts',
  'admin.nav.hosting': 'Hosting',
  'admin.nav.analytics': 'Analytics',
  'admin.nav.aiUsage': 'AI usage',
  'admin.nav.teamMembers': 'Team members',
  'admin.nav.settings': 'Settings',
  'admin.mobile.theme': 'Theme',

  // Dashboard masthead
  'admin.dashboard.masthead.loading': 'Loading workspace overview…',
  'admin.dashboard.masthead.noWorkspaces':
    "You don't have any workspaces yet — capture a brief to start.",
  'admin.dashboard.masthead.workspacesInFlight':
    '{count} workspace in flight today.',
  'admin.dashboard.masthead.workspacesInFlightPlural':
    '{count} workspaces in flight today.',
  'admin.dashboard.cta.newWorkspace': 'New workspace',

  // Stats
  'admin.dashboard.stats.workspaces': 'Workspaces',
  'admin.dashboard.stats.workspacesSub': '{draft} draft · {building} in build',
  'admin.dashboard.stats.live': 'Live',
  'admin.dashboard.stats.liveSubOn': 'Published sites',
  'admin.dashboard.stats.liveSubOff': 'None live yet',
  'admin.dashboard.stats.setupPaid': 'Setup paid',
  'admin.dashboard.stats.setupPaidSub': '{count} invoice settled',
  'admin.dashboard.stats.setupPaidSubPlural': '{count} invoices settled',
  'admin.dashboard.stats.mrr': 'MRR',
  'admin.dashboard.stats.mrrSub': '{arr} run-rate (ARR)',
  'admin.dashboard.stats.aiMtd': 'AI · MTD',
  'admin.dashboard.stats.aiMtdSub': '{count} active session today',
  'admin.dashboard.stats.aiMtdSubPlural': '{count} active sessions today',

  // Panels
  'admin.dashboard.pipeline.eyebrow': 'Pipeline',
  'admin.dashboard.pipeline.title': 'Workflow board',
  'admin.dashboard.pipeline.metaWithCount':
    '{count} workspace · drag cards between stages',
  'admin.dashboard.pipeline.metaWithCountPlural':
    '{count} workspaces · drag cards between stages',
  'admin.dashboard.pipeline.metaEmpty':
    'Drag cards between stages when you add workspaces',

  'admin.dashboard.recent.eyebrow': 'Workspaces',
  'admin.dashboard.recent.title': 'Recent activity',
  'admin.dashboard.recent.metaTotal': '{count} total',

  'admin.dashboard.viewAll': 'View all',

  'admin.dashboard.accounts.eyebrow': 'Directory',
  'admin.dashboard.accounts.title': 'Accounts',
  'admin.dashboard.accounts.meta': '{count} with billing or contact on file',

  // Projects table
  'admin.dashboard.table.workspace': 'Workspace',
  'admin.dashboard.table.account': 'Account',
  'admin.dashboard.table.tier': 'Tier',
  'admin.dashboard.table.stage': 'Stage',
  'admin.dashboard.table.updated': 'Updated',
  'admin.dashboard.table.emptyAccount': '—',
  'admin.dashboard.projects.emptyTitle': 'No workspaces yet',
  'admin.dashboard.projects.emptyBody':
    'Capture a discovery brief and a row will appear here.',

  // Project row actions
  'admin.dashboard.project.actions.label': 'Project actions',
  'admin.dashboard.project.actions.rename': 'Rename',
  'admin.dashboard.project.actions.delete': 'Delete',
  'admin.dashboard.project.renamePrompt': 'Rename project',
  'admin.dashboard.project.deleteConfirm':
    'Delete "{name}"? This cannot be undone.',
  'admin.dashboard.project.deleteConfirmUnnamed':
    'Delete this project? This cannot be undone.',
  'admin.dashboard.project.untitled': 'Untitled',

  // Stage / tier labels — keys mirror what the table maps to via STAGE_I18N_KEYS
  'admin.stage.intake': 'Intake',
  'admin.stage.brief': 'Brief',
  'admin.stage.build': 'Build',
  'admin.stage.review': 'Review',
  'admin.stage.live': 'Live',
  'admin.tier.essential': 'Essential',
  'admin.tier.pro': 'Pro',
  'admin.tier.commerce': 'Commerce',
  'admin.tier.custom': 'Custom',

  // Clients table
  'admin.dashboard.clients.col.account': 'Account',
  'admin.dashboard.clients.col.contact': 'Contact',
  'admin.dashboard.clients.col.tier': 'Tier',
  'admin.dashboard.clients.col.workspaces': 'Workspaces',
  'admin.dashboard.clients.col.setupPaid': 'Setup paid',
  'admin.dashboard.clients.col.lastActivity': 'Last activity',
  'admin.dashboard.clients.col.actions': 'Actions',
  'admin.dashboard.clients.emptyTitle': 'No accounts yet',
  'admin.dashboard.clients.emptyBody':
    'Accounts aggregate billing and contact details from workspaces you link to them. Add contact info when you create or edit a workspace.',
  'admin.dashboard.clients.emptyNextStep': 'Create a workspace →',
  'admin.dashboard.clients.emailAria': 'Email {name}',
  'admin.dashboard.clients.callAria': 'Call {name}',
  'admin.dashboard.clients.unnamed': 'Unnamed client',
} as const;
