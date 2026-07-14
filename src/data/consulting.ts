// Shared data + constants for the AI-Setup-Consulting section.
// All routes stay namespaced under /AI-Setup-Consulting/ (the site root is the portfolio).

// ─── Site constants ─────────────────────────────────────────────────────────
export const SITE = 'https://toamig.com';
export const BRAND = 'Miguel Vieira';
export const CALENDLY_URL = 'https://calendly.com/migueltechlead-support/30min';
export const EMAIL = 'support@migueltechlead.pt';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/toamig';
export const CITY = 'Lisbon, Portugal';

export const BASE = '/AI-Setup-Consulting';
export const BOOK_PATH = `${BASE}/discovery-call`;
export const OG_IMAGE = `${SITE}/og/ai-setup-consulting.png`;

export const NAV = [
  { href: `${BASE}/services`,   label: 'Services' },
  { href: `${BASE}/approach`,   label: 'Approach' },
  { href: `${BASE}/technology`, label: 'Technology' },
  { href: `${BASE}/about`,      label: 'About' },
];

export const STACK = ['Unreal Engine', 'C++', 'Perforce', 'Plastic SCM', 'Anthropic', 'MCP'];

// ─── Hero + positioning (Section 1) ─────────────────────────────────────────
export const HERO = {
  headline: 'AI infrastructure engineered for game studios.',
  subhead: 'Centrally governed, layered by design, built on open standards. Not a chatbot. Not a plugin. The infrastructure your team actually needs to make AI reliable at production scale.',
  positioning: 'We build the layer between your codebase and frontier AI models. The layer that makes AI adoption safe, consistent, measurable, and useful in real game development workflows. Everything is version-controlled, auditable, and yours to keep.',
};

// ─── The three concrete problems (Section 2) ────────────────────────────────
export const PROBLEMS = [
  {
    icon: 'eye-off',
    title: 'Shadow AI is already in your studio.',
    body: 'Developers are using consumer AI accounts on proprietary code right now. Consumer accounts retain data for up to five years and may use it for model training unless explicitly opted out. Most studios have no visibility into which accounts, which code, or which projects are exposed. This is IP leak happening in real time.',
  },
  {
    icon: 'git-branch',
    title: 'AI without guardrails produces inconsistent code.',
    body: 'Every developer’s ad-hoc AI usage produces subtly different conventions, patterns, and architectural choices. The cleanup cost of unifying inconsistent AI-generated code often exceeds the productivity gain that motivated adopting AI in the first place.',
  },
  {
    icon: 'users',
    title: 'AI without governance wastes senior time.',
    body: 'Tech leads spend 15-25% of their week on code review, and much of that time catches convention violations that could have been prevented at write-time. AI properly integrated recovers that time. AI improperly integrated adds review burden by producing plausible-looking code that does not respect studio-specific patterns.',
  },
];

export const PROBLEM_PATTERN = 'Studios that adopt AI without structured infrastructure hit the same three walls: security exposure, code quality drift, and wasted senior capacity. The tools are not the problem. The absence of engineering discipline around the tools is the problem.';

// ─── The layered pipeline (Section 3) ───────────────────────────────────────
// The intellectual centerpiece of the site.
export const PIPELINE = [
  {
    n: '01',
    name: 'Write-Time Assistance',
    oneLine: 'Convention adherence and canonical examples surfaced while code is being written.',
    prose: 'Prevention layer. The developer’s AI assistant knows the studio’s conventions, canonical examples, and architectural constraints while code is being written. Convention violations are avoided at write-time, not caught at review-time.',
    audience: 'Developer',
    trigger: 'IDE session begins / continues',
    time: 'Real-time',
    cost: 'Covered by seats',
    accent: 'Prevention',
  },
  {
    n: '02',
    name: 'Save-Time Validation',
    oneLine: 'Deterministic linter runs on save. Fast, focused, zero AI.',
    prose: 'Linters excel at formatting, naming, and pattern rules that do not require judgment. We do not ask AI to do what a linter does better and cheaper. Millisecond feedback, zero tokens, always local.',
    audience: 'Developer',
    trigger: 'File save',
    time: 'Milliseconds',
    cost: 'Zero (local)',
    accent: 'Deterministic',
  },
  {
    n: '03',
    name: 'Submit-Time Preparation',
    oneLine: 'Pre-submit hook validates description, ticket linkage, reviewer assignment.',
    prose: 'Not the code itself — the metadata around it. Correct CL description, correct ticket linkage, correct reviewers assigned automatically based on file ownership. Lightweight AI check for anything that should not be submitted. Developer stays in control.',
    audience: 'Developer',
    trigger: 'p4 submit (or equivalent)',
    time: '2-5 seconds',
    cost: '~€0.02-0.05 per submit',
    accent: 'Submit-readiness',
  },
  {
    n: '04',
    name: 'Post-Submit Deep Review',
    oneLine: 'Cross-file impact, architectural drift, similar patterns — structured for the tech lead.',
    prose: 'Tech leads do not need AI to tell them the code compiles. They need structured analysis of impact, drift, and pattern consistency so their review time focuses on architectural judgment, not convention enforcement. Posted to Swarm, GitHub, or your review tool for tech lead consumption.',
    audience: 'Tech Lead',
    trigger: 'Post-submit event',
    time: '30-90 seconds',
    cost: '~€0.10-0.40 per CL',
    accent: 'Decision support',
  },
  {
    n: '05',
    name: 'Continuous Evolution',
    oneLine: 'Pattern recognition surfaces brain-update candidates. Documentation drift detected and repaired.',
    prose: 'The layer where the system improves itself. Patterns that appear repeatedly become brain updates. Documentation drift gets flagged. Build failures generate hypothesis-driven fix proposals for tech lead approval. Nothing merges without human review.',
    audience: 'Tech Lead',
    trigger: 'Schedule + build failures',
    time: 'Minutes to hours (batch)',
    cost: 'Predictable weekly total',
    accent: 'Self-improvement',
  },
];

export const PIPELINE_PRINCIPLE = 'No layer autonomously modifies code. AI proposes, engineers decide. This is not a philosophical preference. It is operational necessity. Game development produces edge cases where obvious fixes create subtle regressions. Tech leads approve every code change originating from automation.';

// ─── A typical day in the pipeline (Section 4) ──────────────────────────────
export const TYPICAL_DAY = [
  {
    time: '09:00',
    actor: 'Gameplay engineer',
    body: 'Opens their IDE. Their Claude Code session already knows the studio’s ability framework, naming conventions for this module, and the canonical buff-system implementation — loaded via MCP from the brain (Layer 1).',
  },
  {
    time: '11:20',
    actor: 'Save',
    body: 'The engineer implements a damage-over-time ability. On save, the linter confirms conventions are respected (Layer 2). Millisecond feedback, no tokens spent.',
  },
  {
    time: '11:35',
    actor: 'p4 submit',
    body: 'The pre-submit hook validates that the CL description follows the studio’s template, the Jira ticket is linked, and the right reviewers are assigned based on the files touched (Layer 3). Two seconds, done.',
  },
  {
    time: '11:36',
    actor: 'Automation worker',
    body: 'Layer 4 picks up the submit. Within 60 seconds, a structured review is posted in Swarm: no architectural drift, similar pattern seen in the buff system last month (worth cross-referencing), test coverage suggested for the interaction with existing damage sources.',
  },
  {
    time: '14:00',
    actor: 'Tech lead',
    body: 'Opens Swarm during their afternoon review window. Layer 1 prevented const-correctness misses. Layer 2 caught formatting. Layer 3 caught missing ticket linkage. The lead spends five minutes on the architectural approach instead of forty on the rest.',
  },
  {
    time: 'Next week',
    actor: 'Layer 5',
    body: 'Notices this ability pattern is the third instance of a specific approach not yet in the brain. Proposes an update to the canonical examples. The lead approves. Next month, when another engineer implements a similar ability, Layer 1 already knows the pattern.',
  },
];

export const TYPICAL_DAY_TAKEAWAY = 'The developer never left their normal workflow. No new tools, no context switching. The tech lead’s review compressed from forty minutes to five, spent on architecturally interesting decisions. The brain grew richer without anyone being assigned "brain maintenance" as a formal task. This is what AI infrastructure actually means.';

// ─── The Brain (Section 5) ──────────────────────────────────────────────────
export const BRAIN_CONTENT = [
  { title: 'Conventions',    body: 'Coding standards, naming rules, and formatting requirements per language and subsystem.' },
  { title: 'Architecture',   body: 'Module boundaries, ownership, dependencies, allowed and forbidden interactions.' },
  { title: 'Decisions',      body: 'Architecture decision records (ADRs) with rationale for significant choices.' },
  { title: 'Examples',       body: 'Canonical implementations of common patterns, curated and versioned.' },
  { title: 'Anti-patterns',  body: 'Explicit "never do this" catalog derived from historical bugs and reviews.' },
  { title: 'Workflows',      body: 'Standard procedures for common tasks: new feature, bug fix, refactor.' },
  { title: 'Platform notes', body: 'Sony, Nintendo, Xbox certification requirements and mobile constraints.' },
  { title: 'Skills',         body: 'Task-specific patterns Claude Code uses to accomplish structured workflows.' },
];

export const BRAIN_ACCESS = [
  'Selective context delivery — only requested sections load, not the full brain',
  'Structured responses — typed data, not raw markdown',
  'Access logging — which agent queried what, when',
  'Version awareness — agents can pin to specific brain versions',
  'Access control — role-based restrictions where applicable',
];

export const BRAIN_PROTECTION = [
  'Branch protection on main (PR + reviews required)',
  'CODEOWNERS requires approval from designated tech leads for any change',
  'CI validation runs on every proposed change: markdown lint, schema validation, cross-reference integrity, breaking-change detection',
  'Direct pushes to main blocked at repository level',
  'Force pushes disabled',
  'Deployment to production MCP server only from tagged releases',
];

export const BRAIN_UPDATE_PATHS = [
  {
    n: '01',
    name: 'Human-authored PR',
    tag: 'Standard',
    body: 'Tech lead identifies need for update, creates PR with proposed change, CI validation runs, required reviewers approve, change merges to main, tagged release triggers deployment.',
  },
  {
    n: '02',
    name: 'Automation-proposed PR',
    tag: 'Layer 5',
    body: 'Weekly worker identifies patterns worth capturing, generates a PR with proposed brain updates including rationale and examples. Tech lead reviews with the same rigor as human-authored PRs. Approval path identical to Path 1.',
  },
  {
    n: '03',
    name: 'Emergency hotfix',
    tag: 'Rare',
    body: 'Critical issue in brain content (e.g. outdated security guidance). Designated senior tech lead can fast-track with single approval. Post-hoc review required within 48 hours. Audit log captures rationale.',
  },
];

export const BRAIN_VERSIONING = [
  { label: 'Major (X.0.0)', body: 'Structural changes that require MCP server updates.' },
  { label: 'Minor (1.X.0)', body: 'New content, new conventions, new examples.' },
  { label: 'Patch (1.0.X)', body: 'Corrections, clarifications, small updates.' },
];

export const BRAIN_TELEMETRY = [
  'Query frequency per brain section',
  'Query patterns that returned unhelpful results',
  'Sections never queried (candidates for consolidation)',
  'Sections queried but immediately followed by manual overrides (candidates for improvement)',
];

// ─── Technical architecture (Section 6) ─────────────────────────────────────
export const ARCHITECTURE_COMPONENTS = [
  {
    id: 'brain',
    name: 'Brain Repository',
    sub: 'Git, private',
    role: 'Source of truth. Standard Git repository, hosted on your existing infrastructure. All brain content as version-controlled files. Branch protection and CI validation enforce governance.',
    tier: 0,
  },
  {
    id: 'context',
    name: 'Context Server',
    sub: 'Internal VM · 2 vCPU / 4GB',
    role: 'Runs inside your network. Hosts the MCP server that serves brain content to agents. Pulls from repository on tagged releases or webhook triggers. Caches content in memory. Logs all queries.',
    tier: 1,
  },
  {
    id: 'session',
    name: 'Developer Session',
    sub: 'Claude Code + MCP client',
    role: 'Existing developer workstation running Claude Code or IDE integration. Configured to connect to the Context Server via MCP. Loads studio-adapted skills at session start. No changes to developer workflow.',
    tier: 2,
  },
  {
    id: 'worker',
    name: 'Automation Worker',
    sub: 'Small VM or serverless',
    role: 'Listens for events from studio systems (Perforce triggers, CI hooks, scheduled jobs). Constructs prompts with relevant brain context, calls Anthropic API, receives responses, posts results to studio systems.',
    tier: 2,
  },
  {
    id: 'api',
    name: 'Anthropic API',
    sub: 'or Bedrock / Vertex AI',
    role: 'Where inference happens. Direct Anthropic API with Zero Data Retention addendum, or AWS Bedrock / Google Vertex AI hosting Claude within your cloud provider account, depending on privacy tier.',
    tier: 3,
  },
  {
    id: 'studio',
    name: 'Studio Systems',
    sub: 'Perforce, Swarm, Jira, Slack',
    role: 'Your existing infrastructure. We integrate; we do not replace. Perforce or Plastic SCM or Git. Swarm or GitHub or GitLab. Jira or Linear. Slack or Teams. Your CI/CD system.',
    tier: 3,
  },
];

export const ARCHITECTURE_FOOTPRINT = [
  { label: 'Infrastructure added',        value: 'Two small VMs' },
  { label: 'Data added',                  value: 'One Git repository (megabytes)' },
  { label: 'Maintenance overhead',        value: 'Standard sysadmin work' },
];

// ─── The four privacy tiers (Section 7) ─────────────────────────────────────
export const PRIVACY_TIERS = [
  {
    tier: 'Tier 1',
    title: 'Claude for Work / Enterprise',
    subtitle: 'UI-based',
    body: 'Standard commercial terms. Anthropic hosts everything. No training on your data (default). 30-day operational retention for safety and debugging.',
    when: 'Indie and small studios without strict IP requirements.',
  },
  {
    tier: 'Tier 2',
    title: 'Claude API with Zero Data Retention',
    subtitle: 'Contractual addendum',
    body: 'A contractual addendum with Anthropic that removes retention beyond immediate processing. Requires separate negotiation. Prompts and responses processed and immediately discarded.',
    when: 'Studios with moderate IP sensitivity or publisher requirements.',
  },
  {
    tier: 'Tier 3',
    title: 'AWS Bedrock or Google Vertex AI',
    subtitle: 'Runs in your cloud',
    body: 'Claude runs inside your cloud provider account. Your code never touches Anthropic infrastructure directly. Data residency guaranteed by your cloud provider. Zero data retention automatic.',
    when: 'Studios with strict IP requirements, regulatory compliance, or existing cloud commitments.',
  },
  {
    tier: 'Tier 4',
    title: 'Self-hosted Sandboxes with MCP Tunnels',
    subtitle: 'Nothing leaves the perimeter',
    body: 'Tool execution and data access happens inside your perimeter. The Anthropic agent loop coordinates, but sensitive operations stay in your infrastructure.',
    when: 'AAA studios with console SDKs, strict NDAs, or classified project requirements.',
  },
];

export const PRIVACY_DISTINCTION = {
  training: {
    title: 'No training on our data',
    body: 'Default in every commercial Anthropic plan. You do not need special contracts for this. Consumer accounts (Free, Pro, Max) require explicit opt-out; commercial and enterprise accounts have it by default.',
  },
  retention: {
    title: 'No retention of our data',
    body: 'Requires the Zero Data Retention addendum or a higher-tier deployment. This is a separate contractual layer. Commercial API retains data for 30 days operationally; ZDR eliminates that retention.',
  },
};

// ─── Studio-adapted skills library (Section 9) ──────────────────────────────
export const SKILLS_LIBRARY = [
  {
    domain: 'Gameplay development',
    icon: 'zap',
    skills: [
      { name: 'new-ability',        body: 'Creates a gameplay ability following the studio’s ability framework.' },
      { name: 'new-character',      body: 'Creates a character class with the studio’s pawn hierarchy.' },
      { name: 'new-game-mode',      body: 'Creates a game mode with proper replication setup.' },
      { name: 'add-buff-effect',    body: 'Adds a status effect following the studio’s framework.' },
    ],
  },
  {
    domain: 'Systems development',
    icon: 'workflow',
    skills: [
      { name: 'new-manager',            body: 'Creates a subsystem manager following initialization conventions.' },
      { name: 'new-service',            body: 'Creates a service class with lifecycle management.' },
      { name: 'refactor-to-component',  body: 'Refactors to the studio’s component architecture.' },
    ],
  },
  {
    domain: 'Content pipeline',
    icon: 'layers',
    skills: [
      { name: 'new-asset-type',          body: 'Adds a custom asset type with editor integration.' },
      { name: 'new-editor-tool',         body: 'Creates an editor extension following Slate conventions.' },
      { name: 'add-content-validation',  body: 'Adds validation rules to the content pipeline.' },
    ],
  },
  {
    domain: 'Multiplayer and networking',
    icon: 'git-branch',
    skills: [
      { name: 'add-replicated-property', body: 'Adds proper replication with rollback consideration.' },
      { name: 'new-rpc',                 body: 'Creates client/server RPC with validation.' },
      { name: 'add-prediction',          body: 'Adds client-side prediction to a gameplay action.' },
    ],
  },
  {
    domain: 'Testing',
    icon: 'clipboard-check',
    skills: [
      { name: 'unit-test-scaffold',        body: 'Generates a unit test skeleton matching the studio’s framework.' },
      { name: 'integration-test-scaffold', body: 'Generates integration test setup.' },
      { name: 'test-for-bug',              body: 'Generates a failing test that reproduces a described bug.' },
    ],
  },
  {
    domain: 'Debugging',
    icon: 'search',
    skills: [
      { name: 'investigate-crash',       body: 'Guided crash log investigation with known patterns.' },
      { name: 'investigate-performance', body: 'Performance investigation with the studio’s profiling tools.' },
      { name: 'investigate-network',     body: 'Networking issue investigation with debug tools.' },
    ],
  },
  {
    domain: 'Documentation',
    icon: 'book-open',
    skills: [
      { name: 'document-module', body: 'Generates module documentation matching standards.' },
      { name: 'document-api',    body: 'Generates API reference for public interfaces.' },
      { name: 'write-adr',       body: 'Creates an architecture decision record following the template.' },
    ],
  },
  {
    domain: 'Onboarding',
    icon: 'route',
    skills: [
      { name: 'onboard-to-module', body: 'Guides a new developer through an unfamiliar module.' },
      { name: 'explain-subsystem', body: 'Deep-dive explanation of a subsystem for context.' },
      { name: 'find-owner',        body: 'Identifies owning team and key contacts.' },
    ],
  },
  {
    domain: 'Compliance',
    icon: 'shield-check',
    skills: [
      { name: 'check-platform-compliance', body: 'Validates against console certification rules.' },
      { name: 'check-licensing',           body: 'Verifies third-party code has compatible licenses.' },
      { name: 'check-security-patterns',   body: 'Scans for known vulnerability patterns.' },
    ],
  },
];

// ─── Deliverables framing (for /services/setup) ────────────────────────────
export const DELIVERABLE_GROUPS = [
  {
    icon: 'cpu',
    label: 'Foundational',
    items: [
      { name: 'CLAUDE.md hierarchy',            body: 'Root project context plus per-module context for major subsystems (gameplay, networking, UI, rendering). Depth calibrated to codebase complexity.' },
      { name: 'Brain repository',               body: 'Structured directory layout with templates for guidelines, ADRs, canonical examples, and anti-patterns. CODEOWNERS, PR templates, CI validation included.' },
      { name: 'Retrieval index and manifest',   body: 'Machine-readable mapping between query types and prioritized brain sections. Reduces broad codebase scans and improves token efficiency.' },
      { name: 'Convention extraction package',  body: 'Coding standards distilled from existing documentation combined with patterns observed in the actual codebase. Naming conventions per subsystem and studio-specific anti-patterns catalog.' },
      { name: 'Documentation gap analysis',     body: 'Assessment of existing documentation quality with a prioritized backlog of gaps and recommended owners.' },
    ],
  },
  {
    icon: 'server',
    label: 'Infrastructure',
    items: [
      { name: 'MCP context server deployment', body: 'Configuration-driven server with deployment scripts (Docker, systemd, or Kubernetes manifests). Monitoring and controlled update mechanism.' },
      { name: 'MCP Perforce configuration',    body: 'Setup of the official Perforce MCP server with studio-specific safety rules, path restrictions, and workflow integrations. We configure and integrate; we do not build competing MCP servers.' },
      { name: 'Version control hooks',         body: 'Pre-submit and post-submit review automation. Build system integration.' },
      { name: 'Review tool integrations',      body: 'Automated posting to Swarm, GitHub, GitLab, Jira, or Slack based on event type. Configurable notification routing.' },
      { name: 'Cost monitoring dashboard',     body: 'Per-team token usage tracking, budget alerts, cost attribution by workflow, optimization recommendations.' },
      { name: 'Automation worker deployment',  body: 'Event-driven review engine with configuration for triggers, actions, and integrations.' },
    ],
  },
  {
    icon: 'book-open',
    label: 'Documentation & training',
    items: [
      { name: 'Operating runbook',            body: 'Safe brain updates, adding new skills, configuring new team members, troubleshooting common issues, rolling back problematic updates.' },
      { name: 'ADR template and workflow',    body: 'Standard format for capturing decisions. Brain integration. Developer prompts triggered by significant changes.' },
      { name: 'Training materials',           body: 'Slide decks for tech-lead training (governance, maintenance) and developer training (effective AI workflows for their subsystems). Video walkthroughs, printed cheat sheet.' },
      { name: 'Handover documentation',       body: 'Complete architectural documentation of what was deployed, why, and how to evolve it. Written for the studio’s future engineers, not just current ones.' },
    ],
  },
];

// ─── Success measurement (Section 10) ───────────────────────────────────────
export const SUCCESS_BASELINES = [
  { title: 'Code review cycle time',   body: 'Average time from PR / CL opened to approved.' },
  { title: 'Senior time on review',    body: 'Percentage of tech lead capacity spent on review activities.' },
  { title: 'PR throughput',            body: 'PRs merged per team per week.' },
  { title: 'Bug escape rate',          body: 'Bugs found post-merge vs. caught in review.' },
  { title: 'Onboarding duration',      body: 'Weeks for new hires to reach productive contribution.' },
  { title: 'Token spend per workflow', body: 'Cost of AI-assisted operations by task type.' },
  { title: 'Developer AI utility',     body: 'Structured survey on current AI experience.' },
];

export const SUCCESS_THRESHOLDS = [
  { metric: 'Review cycle time',   target: '−30-50%',  window: 'within 90 days' },
  { metric: 'Senior time on review', target: '−40-60%', window: 'within 180 days' },
  { metric: 'Bug escape rate',     target: '−20-30%',  window: 'within 180 days' },
  { metric: 'Onboarding duration', target: '−40-60%',  window: 'within 90 days (new hires)' },
  { metric: 'Developer satisfaction with AI workflows', target: 'measurably improved', window: 'quarterly' },
];

export const REPORTING_CADENCE = [
  { rhythm: 'Monthly',   what: 'Light-touch check-ins: status, blockers, immediate needs.' },
  { rhythm: 'Quarterly', what: 'Written reports: quantitative data against baselines, qualitative observations, recommendations.' },
  { rhythm: 'Annually',  what: 'Architecture reviews: deep assessment of infrastructure choices and evolution path.' },
];

// ─── Engagement boundaries (Section 11) ─────────────────────────────────────
export const ENGAGEMENT_INCLUDES = [
  'Design and implementation of the five-layer pipeline',
  'Brain repository setup with governance',
  'MCP context server deployment',
  'Studio-adapted skill library',
  'Integration with existing studio systems',
  'Team training for developers and tech leads',
  'Success measurement and reporting',
];

export const ENGAGEMENT_EXCLUDES = [
  { title: 'Building or fine-tuning custom AI models',    body: 'We work with Anthropic’s frontier models, not custom training.' },
  { title: 'Migration support',                            body: 'For teams moving away from Anthropic’s platform.' },
  { title: 'Replacement of engineering leadership',        body: 'We build infrastructure that amplifies your team; we do not make architectural decisions for you.' },
  { title: 'Direct game feature development',              body: 'We build the infrastructure that supports feature development, not the features themselves.' },
  { title: '24/7 support',                                  body: 'Support hours defined by tier. Business hours standard, extended hours available for enterprise engagements.' },
  { title: 'Liability for AI-generated code correctness', body: 'Human review remains the developer’s responsibility. We build infrastructure that makes review efficient.' },
  { title: 'Autonomous code modification',                 body: 'No layer autonomously modifies code without human approval. Regardless of client requests.' },
];

export const ENGAGEMENT_REFERS = [
  'Audio engineering AI adoption',
  'Netcode-specific optimization',
  'Engine source modification work',
  'Legal / compliance certification',
  'Rendering pipeline specialization',
];

// ─── Why this approach works (Section 12) ───────────────────────────────────
export const DIFFERENTIATORS = [
  { title: 'Deep gamedev specialization', body: 'Not adapting generic frameworks. Built by engineers who have shipped games and know what production actually requires.' },
  { title: 'Layered architecture',         body: 'Not throwing AI at every problem. Deliberate design about where each capability belongs and why.' },
  { title: 'Governance-first',             body: 'Brain updates flow through PR review. No developer silently breaks conventions. No rogue changes to shared knowledge.' },
  { title: 'Open standards',               body: 'Everything built on Model Context Protocol, Git, and standard infrastructure. No proprietary lock-in.' },
  { title: 'Cross-studio pattern awareness', body: 'Each engagement makes the next one better. You benefit from patterns learned across studios, respecting all confidentiality.' },
  { title: 'Anthropic ecosystem alignment', body: 'We track Anthropic’s platform evolution continuously. New capabilities integrate within days of release, not months.' },
  { title: 'Honest measurement',           body: 'Baselines captured, targets defined, results reported. If it does not pay back, we tell you and adjust.' },
];

export const WHAT_WE_DONT_CLAIM = [
  'To eliminate the need for senior engineers',
  'Autonomous code generation',
  'Proprietary AI models',
  'That the components we build are unique (many are open source; we use them where appropriate)',
  'Instant transformation — real value takes months to compound',
];

// ─── The four-phase engagement (Section 13) ────────────────────────────────
export const PHASES = [
  {
    step: '01',
    title: 'Discovery Call',
    meta: '30 min · free',
    points: [
      'Confirm fit, your stack, your constraints',
      'No commitment, no pitch deck',
    ],
  },
  {
    step: '02',
    title: 'AI Readiness Audit',
    meta: '1-3 weeks · fixed-fee',
    points: [
      'Codebase walkthrough, workflow mapping, shadow AI scan',
      'Written report with a quantified ROI estimate for your team',
      'Standalone value: you keep the report regardless of next steps',
    ],
  },
  {
    step: '03',
    title: 'Setup & Integration',
    meta: '3-16 weeks',
    points: [
      'All five pipeline layers, brain, MCPs, workers, integrations',
      'Team training included',
      'Before-and-after metrics measured',
    ],
  },
  {
    step: '04',
    title: 'Optimization Retainer',
    meta: 'monthly · ongoing',
    points: [
      'Brain evolution, new capabilities, cost optimization',
      'Quarterly ROI reports',
    ],
  },
];

// ─── Service packages ──────────────────────────────────────────────────────
export const SERVICES = [
  {
    id: 'audit',
    icon: 'search',
    title: 'AI Readiness Audit',
    duration: '1-3 weeks',
    cadence: 'Fixed-fee',
    href: `${BASE}/services/audit`,
    blurb: 'Codebase walkthrough, workflow mapping, shadow AI scan, privacy tier recommendation, phased roadmap, and a written report with a quantified ROI estimate you keep. Nine named deliverables.',
  },
  {
    id: 'setup',
    icon: 'settings',
    title: 'Setup & Integration',
    duration: '3-16 weeks',
    cadence: 'Fixed-fee',
    href: `${BASE}/services/setup`,
    blurb: 'All five pipeline layers implemented and integrated with your stack. Foundational, infrastructure, and documentation deliverables plus a studio-adapted skills library. Delivered module by module with measurement.',
  },
  {
    id: 'retainer',
    icon: 'repeat',
    title: 'Optimization Retainer',
    duration: 'monthly',
    cadence: 'Ongoing',
    href: `${BASE}/services/retainer`,
    blurb: 'Layer 5 in practice. Brain evolution, PR review on AI-related changes, new Claude capabilities folded in, cost optimization, and quarterly ROI reports against Setup baselines.',
  },
];

// ─── Segment summaries ─────────────────────────────────────────────────────
export const SEGMENTS = [
  {
    id: 'indies',
    icon: 'zap',
    size: '10-30 developers',
    title: 'Indies & Small Studios',
    tagline: 'Single project, tight team, moving fast.',
    benefits: ['Faster onboarding', 'Consistent conventions', 'Shadow AI eliminated'],
    href: `${BASE}/for-indies`,
    cta: 'See how we work with indies',
    badge: null,
  },
  {
    id: 'mid',
    icon: 'layers',
    size: '30-80 developers',
    title: 'Mid-Size Studios',
    tagline: 'Multiple projects, dedicated tech leads, formal standards.',
    benefits: ['Cross-project knowledge', '30-50% review time reduction', 'Institutional memory'],
    href: `${BASE}/for-mid-size`,
    cta: 'See how we work with mid-size studios',
    badge: 'Most common engagement',
  },
  {
    id: 'aaa',
    icon: 'building',
    size: '80-300+ developers',
    title: 'AAA & Publishers',
    tagline: 'Multi-site, publisher relationships, strict compliance.',
    benefits: ['Governance', 'Multi-site rollout', 'Console SDK compliance', 'Zero Data Retention'],
    href: `${BASE}/for-aaa`,
    cta: 'See how we work with AAA studios',
    badge: null,
  },
];
