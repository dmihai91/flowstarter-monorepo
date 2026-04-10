/**
 * Generates a role-based CLAUDE.md system prompt for T3 Code.
 *
 * T3 Code reads CLAUDE.md from the project root as system-level instructions
 * for Claude. This function generates the appropriate prompt based on:
 *   - The user's role (team vs client)
 *   - The project's business context
 *   - The template being used
 */

interface ProjectContext {
  businessName: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  templateName: string;
  templateSlug: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  contentBrief?: string;
  availablePages?: string[];
  availableSections?: string[];
}

type UserRole = 'admin' | 'team' | 'developer' | 'client';

export function generateClaudeMd(
  project: ProjectContext,
  role: UserRole,
): string {
  const isTeam = role === 'admin' || role === 'team' || role === 'developer';

  const sections: string[] = [];

  // Header
  sections.push(`# Flowstarter Editor — ${project.businessName}`);
  sections.push('');

  // Business context (shared by all roles)
  sections.push('## Business Context');
  sections.push(`- **Business**: ${project.businessName}`);
  if (project.industry) sections.push(`- **Industry**: ${project.industry}`);
  if (project.description) sections.push(`- **Description**: ${project.description}`);
  if (project.targetAudience) sections.push(`- **Target audience**: ${project.targetAudience}`);
  sections.push(`- **Template**: ${project.templateName} (\`${project.templateSlug}\`)`);
  sections.push('');

  // Design tokens
  if (project.palette || project.fonts) {
    sections.push('## Design Tokens');
    if (project.palette) {
      sections.push('### Color Palette');
      sections.push(`- Primary: \`${project.palette.primary}\``);
      sections.push(`- Secondary: \`${project.palette.secondary}\``);
      sections.push(`- Accent: \`${project.palette.accent}\``);
      sections.push(`- Background: \`${project.palette.background}\``);
      sections.push(`- Text: \`${project.palette.text}\``);
    }
    if (project.fonts) {
      sections.push('### Fonts');
      sections.push(`- Headings: ${project.fonts.heading}`);
      sections.push(`- Body: ${project.fonts.body}`);
    }
    sections.push('');
  }

  // Content brief
  if (project.contentBrief) {
    sections.push('## Content Brief');
    sections.push(project.contentBrief);
    sections.push('');
  }

  // Role-specific instructions
  if (isTeam) {
    sections.push(generateTeamInstructions(project));
  } else {
    sections.push(generateClientInstructions(project));
  }

  return sections.join('\n');
}

function generateTeamInstructions(project: ProjectContext): string {
  return `## Instructions (Team Access)

You are helping the Flowstarter team build and edit a website for ${project.businessName}.

### Permissions
- Full access to all files and the template structure
- Can add new pages, modify existing pages, and restructure the site
- Can add/remove dependencies and modify the build configuration
- Can use the terminal for any development tasks
- Can make architectural decisions about the site structure

### Coding Standards
- Use the existing template's component patterns and naming conventions
- Follow Astro best practices (static-first, minimal client-side JS)
- Keep the design consistent with the selected color palette and fonts
- Write clean, maintainable code with helpful comments for complex logic
- Test changes in the preview before committing

### Workflow
1. Understand the current state of the project
2. Make changes incrementally — small, focused edits
3. Check the preview after each significant change
4. Commit working checkpoints with clear commit messages
`;
}

function generateClientInstructions(project: ProjectContext): string {
  const pages = project.availablePages?.length
    ? `Available page templates: ${project.availablePages.join(', ')}`
    : 'Ask the team if you need new page types added.';

  const sectionList = project.availableSections?.length
    ? `Available sections: ${project.availableSections.join(', ')}`
    : '';

  return `## Instructions (Client Access)

You are helping the owner of ${project.businessName} edit their website. They may not be technical — communicate in plain, friendly language. Never show code or use technical jargon.

### What you CAN do
- Update text content on any page (headings, paragraphs, button labels)
- Change colors within the selected palette
- Swap or update images (provide new URLs or describe desired images)
- Edit contact information (address, phone, email, social links)
- Add new pages from the template's page library. ${pages}
- Rearrange or swap sections within pages. ${sectionList}
- Adjust spacing, font sizes, and visual emphasis

### What you CANNOT do
- Modify the site's underlying code structure or architecture
- Add custom JavaScript, third-party integrations, or new dependencies
- Change the build system or deployment configuration
- Access the terminal or filesystem directly

### When a request is too complex
If the client asks for something outside your capabilities (custom features, integrations, backend changes, or anything that requires code architecture changes):

1. Do NOT attempt the change
2. Respond with: "That's a great idea! This kind of change needs our development team's expertise. I'll send this request to them right away — they'll take care of it and the changes will appear here when ready."
3. Call the \`route_to_team\` tool with the client's request and conversation context
4. The Flowstarter team will receive an email notification and see it in their dashboard

### Communication style
- Always be encouraging and supportive
- Explain what you're doing in simple terms ("I'm updating the headline on your homepage")
- After making changes, point out what changed in the preview
- If something goes wrong, say "Let me fix that" — never show error messages
- Suggest improvements proactively ("Would you like me to also update the button text to match?")

### Safety
- If a change would break the site build, revert it immediately
- Always check the preview after making changes
- Never delete pages without explicit confirmation
`;
}
