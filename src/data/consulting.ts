// Shared data + constants for the AI-Setup-Consulting section.
// All routes stay namespaced under /AI-Setup-Consulting/ (site root = portfolio).
//
// This data layer is intentionally model-agnostic. We work with whatever AI
// stack the studio prefers: Claude, GPT, Gemini, Bedrock/Vertex/Azure OpenAI,
// or self-hosted open-weight models (Llama, Mistral, DeepSeek). We advise on
// trade-offs; the studio picks. MCP is an industry-adopted open standard
// referenced neutrally.

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

// Simplified nav — sitemap consolidated to 4 pages
export const NAV = [
  { href: `${BASE}/technology`, label: 'Method' },
  { href: `${BASE}/about`,      label: 'About' },
];

export const STACK = ['Unreal Engine', 'C++', 'Perforce', 'Plastic SCM', 'MCP'];

// ─── Hero + positioning ─────────────────────────────────────────────────────
export const HERO = {
  headline: 'AI infrastructure engineered for game studios.',
  lede: 'A governed knowledge layer and a layered pipeline that make AI adoption safe, consistent, and measurable — with the AI stack your studio chooses.',
  clarifier: 'Not a chatbot. Not a plugin. Model-agnostic infrastructure your team owns.',
};

// ─── The three concrete problems ────────────────────────────────────────────
export const PROBLEMS = [
  {
    icon: 'eye-off',
    title: 'Shadow AI is already in your studio.',
    body: 'Developers are using consumer AI accounts on proprietary code right now. Consumer accounts routinely retain data for years and may use it for model training unless explicitly opted out. Most studios have no visibility into which accounts, which code, or which projects are exposed.',
  },
  {
    icon: 'git-branch',
    title: 'Ad-hoc AI produces inconsistent code.',
    body: 'Every developer’s personal AI usage produces subtly different conventions, subtly different patterns, subtly different architectural choices. The cleanup cost of unifying inconsistent AI-generated code often exceeds the productivity gain that motivated adopting AI in the first place.',
  },
  {
    icon: 'users',
    title: 'AI without governance wastes senior time.',
    body: 'Tech leads spend 15-25% of their week on code review, and much of that time catches convention violations that could have been prevented at write-time. AI properly integrated recovers that time. AI improperly integrated adds review burden by producing plausible-looking code that does not respect studio-specific patterns.',
  },
];

export const PROBLEM_PATTERN = 'Studios that adopt AI without structured infrastructure hit the same three walls: security exposure, code quality drift, and wasted senior capacity. The tools are not the problem. The absence of engineering discipline around the tools is the problem.';

// ─── The solution (introductory framing) ────────────────────────────────────
export const SOLUTION_INTRO = 'We build the layer between your codebase and whichever AI models you use — a governed knowledge layer that captures your studio’s conventions, and a layered pipeline that applies the right check at the right moment.';

// ─── The layered pipeline ──────────────────────────────────────────────────
// Each layer now carries full deployment metadata:
//   where     — physical location the code runs (workstation / server / etc.)
//   paidVia   — how the AI usage is billed (seat / API key / free)
//   trigger   — event that fires the layer
//   time      — time-to-result
//   audience  — who consumes the output
export const PIPELINE = [
  {
    n: '01',
    name: 'Write-Time Assistance',
    oneLine: 'Convention adherence and canonical examples surfaced while code is being written.',
    prose: 'Prevention. The developer’s AI assistant knows your studio’s conventions, canonical examples, and architectural constraints while code is being written. Convention violations are avoided at write-time, not caught at review-time.',
    where: 'Developer workstation, in the AI coding assistant',
    audience: 'Developer',
    trigger: 'IDE session',
    time: 'Real-time',
    paidVia: 'Developer seat',
    cost: 'Covered by seats',
    accent: 'Prevention',
  },
  {
    n: '02',
    name: 'Save-Time Validation',
    oneLine: 'Deterministic linter runs on save. Fast, focused, zero AI.',
    prose: 'Linters excel at formatting, naming, and pattern rules that do not require judgment. We do not ask AI to do what a linter does better and cheaper. Millisecond feedback, zero tokens, always local.',
    where: 'Developer workstation, in the linter (not the AI assistant)',
    audience: 'Developer',
    trigger: 'File save',
    time: 'Milliseconds',
    paidVia: 'Free (open-source linters)',
    cost: 'Zero (local)',
    accent: 'Deterministic',
  },
  {
    n: '03',
    name: 'Submit-Time Preparation',
    oneLine: 'Pre-submit hook validates and drafts the metadata around the submit — description, ticket linkage, reviewers.',
    prose: 'Not the code itself — the metadata around it. Correct CL description (often generated from the diff and ticket), correct ticket linkage, correct reviewers assigned automatically based on file ownership. Path safety and scope coherence checked. Developer stays in control.',
    where: 'Developer workstation, triggered by the VCS (p4 submit / git push)',
    audience: 'Developer',
    trigger: 'p4 submit / git push',
    time: '2-5 seconds',
    paidVia: 'Developer seat OR studio API key (Setup choice)',
    cost: '€0 (via seat) or ~€0.02-0.05 / submit (via API)',
    accent: 'Submit-readiness',
  },
  {
    n: '04',
    name: 'Post-Submit Deep Review',
    oneLine: 'Cross-file impact, architectural drift, similar patterns — structured for the tech lead.',
    prose: 'Runs asynchronously on a server-side worker after a changelist lands. Tech leads do not need AI to tell them the code compiles. They need structured analysis of impact, drift, and pattern consistency so their review time focuses on architectural judgment. Posted to Swarm, GitHub, or your review tool.',
    where: 'Server-side automation worker (small VM in your network)',
    audience: 'Tech Lead',
    trigger: 'Post-submit trigger (webhook)',
    time: '30-90 seconds',
    paidVia: 'Studio API key',
    cost: '~€0.10-0.40 / CL',
    accent: 'Decision support',
  },
  {
    n: '05',
    name: 'Continuous Evolution',
    oneLine: 'Pattern recognition surfaces knowledge-layer updates. Documentation drift detected and repaired.',
    prose: 'The layer where the system improves itself. Weekly cron jobs plus build-failure events. Patterns that appear repeatedly become knowledge updates. Documentation drift gets flagged. Build failures generate hypothesis-driven fix proposals — never applied automatically.',
    where: 'Server-side automation worker (same or separate VM as Layer 4)',
    audience: 'Tech Lead',
    trigger: 'Cron (weekly / monthly) + build-failure events',
    time: 'Minutes to hours (batch)',
    paidVia: 'Studio API key',
    cost: '~€5-30 / week',
    accent: 'Self-improvement',
  },
];

export const PIPELINE_PRINCIPLE = 'No layer autonomously modifies code. AI proposes, engineers decide. This is not a philosophical preference. It is operational necessity. Game development produces edge cases where obvious fixes create subtle regressions. Tech leads approve every code change originating from automation.';

// ─── A typical day narrative ───────────────────────────────────────────────
export const TYPICAL_DAY = [
  {
    time: '09:00',
    actor: 'Gameplay engineer',
    body: 'Opens their IDE. Their AI coding assistant already knows the studio’s ability framework, naming conventions for this module, and the canonical buff-system implementation — loaded via MCP from the knowledge layer (Layer 1).',
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
    body: 'Notices this ability pattern is the third instance of a specific approach not yet in the knowledge layer. Proposes an update to the canonical examples. The lead approves. Next month, when another engineer implements a similar ability, Layer 1 already knows the pattern.',
  },
];

export const TYPICAL_DAY_TAKEAWAY = 'The developer never left their normal workflow. No new tools, no context switching. The tech lead’s review compressed from forty minutes to five, spent on architecturally interesting decisions. The knowledge layer grew richer without anyone being assigned maintenance as a formal task.';

// ─── The knowledge layer (formerly "the brain") ────────────────────────────
export const BRAIN_CONTENT = [
  { title: 'Conventions',    body: 'Coding standards, naming rules, and formatting requirements per language and subsystem.' },
  { title: 'Architecture',   body: 'Module boundaries, ownership, dependencies, allowed and forbidden interactions.' },
  { title: 'Decisions',      body: 'Architecture decision records with rationale for significant choices.' },
  { title: 'Examples',       body: 'Canonical implementations of common patterns, curated and versioned.' },
  { title: 'Anti-patterns',  body: 'Explicit "never do this" catalog derived from historical bugs and reviews.' },
  { title: 'Workflows',      body: 'Standard procedures for common tasks: new feature, bug fix, refactor.' },
  { title: 'Platform notes', body: 'Console SDK guidance, certification requirements, mobile constraints.' },
  { title: 'Skills',         body: 'Task-specific patterns your AI assistant uses to accomplish structured workflows.' },
];

export const BRAIN_ACCESS = [
  'Selective context delivery — only requested sections load, not the full knowledge layer',
  'Structured responses — typed data, not raw markdown',
  'Access logging — which agent queried what, when',
  'Version awareness — agents can pin to specific versions',
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
    body: 'Weekly worker identifies patterns worth capturing, generates a PR with proposed updates including rationale and examples. Tech lead reviews with the same rigor as human-authored PRs.',
  },
  {
    n: '03',
    name: 'Emergency hotfix',
    tag: 'Rare',
    body: 'Critical issue in content (e.g. outdated security guidance). Designated senior tech lead fast-tracks with single approval. Post-hoc review required within 48 hours. Audit log captures rationale.',
  },
];

export const BRAIN_VERSIONING = [
  { label: 'Major (X.0.0)', body: 'Structural changes that require MCP server updates.' },
  { label: 'Minor (1.X.0)', body: 'New content, new conventions, new examples.' },
  { label: 'Patch (1.0.X)', body: 'Corrections, clarifications, small updates.' },
];

export const BRAIN_TELEMETRY = [
  'Query frequency per section',
  'Query patterns that returned unhelpful results',
  'Sections never queried (candidates for consolidation)',
  'Sections queried but immediately followed by manual overrides (candidates for improvement)',
];

// ─── Technical architecture ────────────────────────────────────────────────
// `side` distinguishes studio-hosted vs vendor-hosted components. `tier`
// remains for vertical ordering in the mobile stack fallback.
export const ARCHITECTURE_COMPONENTS = [
  {
    id: 'brain',
    name: 'Knowledge Repository',
    sub: 'Git, private',
    role: 'Source of truth. Standard Git repository, hosted on your existing infrastructure. All knowledge as version-controlled files. Branch protection and CI validation enforce governance.',
    side: 'studio',
    tier: 0,
  },
  {
    id: 'context',
    name: 'MCP Context Server',
    sub: 'Small VM · 2 vCPU / 4GB',
    role: 'Runs inside your network. Serves knowledge to AI agents through MCP. Pulls from the repository on tagged releases. Caches content in memory. Logs all queries.',
    side: 'studio',
    tier: 1,
  },
  {
    id: 'session',
    name: 'Developer Workstation',
    sub: 'Any MCP-compatible client',
    role: 'Existing developer workstation running an AI coding assistant configured to connect to the Context Server via MCP. Loads studio-adapted skills at session start. Interactive AI usage happens here.',
    side: 'studio',
    tier: 2,
  },
  {
    id: 'worker',
    name: 'Automation Worker',
    sub: 'Small VM or serverless',
    role: 'Listens for events from studio systems (VCS triggers, CI hooks, scheduled jobs). Constructs prompts with relevant context, calls the vendor API, and posts results back to studio systems.',
    side: 'studio',
    tier: 2,
  },
  {
    id: 'studio',
    name: 'Studio Systems',
    sub: 'Perforce, Swarm, Jira, Slack, CI',
    role: 'Your existing infrastructure. We integrate; we do not replace. Perforce or Plastic SCM or Git. Swarm or GitHub or GitLab. Jira or Linear. Slack or Teams. Your CI/CD system.',
    side: 'studio',
    tier: 3,
  },
  {
    id: 'seats',
    name: 'Interactive AI Seats',
    sub: 'Vendor-hosted',
    role: 'Commercial AI seats used by developers for interactive coding assistance. Claude for Work, ChatGPT Enterprise, Gemini for Google Workspace — your choice. Fixed monthly cost per developer, paid directly to the vendor.',
    side: 'vendor',
    tier: 2,
  },
  {
    id: 'api',
    name: 'Programmatic AI API',
    sub: 'Vendor-hosted · key-based',
    role: 'Vendor API used by the automation worker for server-side operations. Anthropic, OpenAI, or Google AI — matched to your vendor. Zero Data Retention addendum standard. Can route through AWS Bedrock, Google Vertex AI, or Azure OpenAI for stricter privacy tiers.',
    side: 'vendor',
    tier: 3,
  },
];

export const ARCHITECTURE_FOOTPRINT = [
  { label: 'Infrastructure added',  value: 'Two small VMs' },
  { label: 'Data added',            value: 'One Git repository (megabytes)' },
  { label: 'Maintenance overhead',  value: 'Standard sysadmin work' },
];

// ─── The four privacy tiers (vendor-agnostic) ──────────────────────────────
export const PRIVACY_TIERS = [
  {
    tier: 'Tier 1',
    title: 'SaaS with commercial terms',
    subtitle: 'Vendor-hosted, no training',
    body: 'Standard commercial terms with a hosted AI provider. No training on your data (default in commercial plans). Short operational retention for safety and debugging.',
    when: 'Indie and small studios without strict IP requirements.',
    examples: 'Claude for Work · ChatGPT Enterprise · Gemini for Google Workspace',
  },
  {
    tier: 'Tier 2',
    title: 'API with retention addendum',
    subtitle: 'Zero data retention',
    body: 'API access with a contractual addendum removing retention beyond immediate processing. Requires separate negotiation with your chosen vendor. Prompts and responses processed and immediately discarded.',
    when: 'Studios with moderate IP sensitivity or publisher requirements.',
    examples: 'Anthropic API + ZDR · OpenAI API + ZDR · Google Vertex with logs disabled',
  },
  {
    tier: 'Tier 3',
    title: 'Model hosted in your cloud',
    subtitle: 'Runs inside your account',
    body: 'The model runs inside your cloud provider account. Your code never touches the vendor’s infrastructure directly. Data residency guaranteed by your cloud provider. Zero data retention automatic.',
    when: 'Studios with strict IP requirements, regulatory compliance, or existing cloud commitments.',
    examples: 'AWS Bedrock · Google Vertex AI · Azure OpenAI',
  },
  {
    tier: 'Tier 4',
    title: 'Self-hosted open-weight models',
    subtitle: 'Nothing leaves the perimeter',
    body: 'Open-weight models running entirely on your infrastructure, coordinated by MCP tunnels. Tool execution and data access stay inside your perimeter.',
    when: 'AAA studios with console SDKs, strict NDAs, or classified project requirements.',
    examples: 'Llama 3 / 4 · Mistral · DeepSeek · Qwen — behind your firewall',
  },
];

export const PRIVACY_DISTINCTION = {
  training: {
    title: 'No training on your data',
    body: 'Default in every commercial AI plan across major vendors. You do not need special contracts for this. Consumer accounts (personal Claude, ChatGPT, Gemini) typically require explicit opt-out; commercial and enterprise accounts have it by default.',
  },
  retention: {
    title: 'No retention of your data',
    body: 'Requires a Zero Data Retention addendum or a higher-tier deployment (in-cloud or self-hosted). This is a separate contractual layer. Commercial APIs typically retain data for 30 days operationally; ZDR eliminates that retention.',
  },
};

// ─── Studio-adapted skills library ─────────────────────────────────────────
// A "skill" is a task-specific pattern the AI uses. Model-agnostic in concept.
export const SKILLS_LIBRARY = [
  {
    domain: 'Gameplay development',
    icon: 'zap',
    skills: [
      { name: 'new-ability',        body: 'Creates a gameplay ability following your studio’s ability framework.' },
      { name: 'new-character',      body: 'Creates a character class with your pawn hierarchy.' },
      { name: 'new-game-mode',      body: 'Creates a game mode with proper replication setup.' },
      { name: 'add-buff-effect',    body: 'Adds a status effect following your framework.' },
    ],
  },
  {
    domain: 'Systems',
    icon: 'workflow',
    skills: [
      { name: 'new-manager',            body: 'Creates a subsystem manager following initialization conventions.' },
      { name: 'new-service',            body: 'Creates a service class with lifecycle management.' },
      { name: 'refactor-to-component',  body: 'Refactors to your component architecture.' },
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
    domain: 'Multiplayer & networking',
    icon: 'git-branch',
    skills: [
      { name: 'add-replicated-property', body: 'Adds proper replication with rollback consideration.' },
      { name: 'new-rpc',                 body: 'Creates client / server RPC with validation.' },
      { name: 'add-prediction',          body: 'Adds client-side prediction to a gameplay action.' },
    ],
  },
  {
    domain: 'Testing',
    icon: 'clipboard-check',
    skills: [
      { name: 'unit-test-scaffold',        body: 'Generates a unit test skeleton matching your framework.' },
      { name: 'integration-test-scaffold', body: 'Generates integration test setup.' },
      { name: 'test-for-bug',              body: 'Generates a failing test that reproduces a described bug.' },
    ],
  },
  {
    domain: 'Debugging',
    icon: 'search',
    skills: [
      { name: 'investigate-crash',       body: 'Guided crash log investigation with known patterns.' },
      { name: 'investigate-performance', body: 'Performance investigation with your profiling tools.' },
      { name: 'investigate-network',     body: 'Networking issue investigation.' },
    ],
  },
  {
    domain: 'Documentation',
    icon: 'book-open',
    skills: [
      { name: 'document-module', body: 'Generates module documentation matching your standards.' },
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

// ─── Examples of what typically ends up in a deliverables package ──────────
// Framed as "examples" not "packages" — everything scoped per engagement.
export const DELIVERABLE_EXAMPLES = [
  {
    icon: 'cpu',
    title: 'The knowledge layer',
    body: 'A structured, version-controlled knowledge repository holding your studio’s conventions, architecture, ADRs, canonical examples, anti-patterns, and skills. Governance is technical — CODEOWNERS, CI validation, tagged releases.',
  },
  {
    icon: 'server',
    title: 'MCP context server',
    body: 'An internal VM serving your knowledge layer to AI agents through MCP. Configuration-driven, cached, audit-logged. Two vCPU, 4GB RAM typical.',
  },
  {
    icon: 'git-pull-request',
    title: 'Layered pipeline hooks',
    body: 'Pre-submit hooks, post-submit workers, and automation for the review pipeline. Integrated with Perforce (or Plastic, or Git), Swarm (or GitHub, or GitLab), and your CI system.',
  },
  {
    icon: 'workflow',
    title: 'Studio-adapted skill library',
    body: 'Task-specific patterns the AI uses to accomplish structured workflows — from `new-ability` to `investigate-crash` — adapted to your framework and conventions.',
  },
  {
    icon: 'gauge',
    title: 'Cost and telemetry dashboards',
    body: 'Per-team token usage, prompt-cache hit rate, budget alerts, cost attribution by workflow, and knowledge-layer query telemetry for quarterly health reviews.',
  },
  {
    icon: 'book-open',
    title: 'Operating runbook and training',
    body: 'Runbook for your operating lead covering safe knowledge updates, adding skills, rollback, and troubleshooting. Training materials for developers and tech leads, with recordings.',
  },
];

export const DELIVERABLES_INTRO = 'Every engagement produces defined deliverables scoped in the proposal. What you actually receive depends on your studio size, existing tooling, and privacy requirements — we do not sell fixed packages. What appears below is representative of what typically ends up in a delivered engagement.';

// ─── Engagement flow (single stream, not 3 packages) ───────────────────────
export const ENGAGEMENT_FLOW = [
  {
    n: '01',
    label: 'Discovery Call',
    meta: '30 min · free',
    body: 'We confirm fit, discuss your stack and constraints, and either identify a clear path forward or honestly tell you we are not the right partner.',
  },
  {
    n: '02',
    label: 'Scoped Proposal',
    meta: 'after Audit',
    body: 'A short Audit — one to three weeks depending on studio size — surfaces your codebase realities, IP sensitivity, and integration surface. Deliverable is a written proposal with fixed price, timeline, and named deliverables. You keep the Audit report regardless of next steps.',
  },
  {
    n: '03',
    label: 'Build',
    meta: '3-16 weeks · fixed-fee',
    body: 'We implement what the proposal describes — knowledge layer, pipeline hooks, MCP integrations, skill library, dashboards, training. Delivered module by module with baseline metrics captured before rollout and re-measured after.',
  },
  {
    n: '04',
    label: 'Support',
    meta: 'monthly · optional',
    body: 'Layer 5 in practice. Ongoing knowledge evolution, PR review on AI-related changes, new model capabilities folded in, cost tuning, and quarterly ROI reports. Optional after Build ships; no obligation to continue.',
  },
];

// ─── Success measurement ───────────────────────────────────────────────────
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
];

export const REPORTING_CADENCE = [
  { rhythm: 'Monthly',   what: 'Light-touch check-ins: status, blockers, immediate needs.' },
  { rhythm: 'Quarterly', what: 'Written reports: quantitative data against baselines, qualitative observations, recommendations.' },
  { rhythm: 'Annually',  what: 'Architecture reviews: deep assessment of infrastructure choices and evolution path.' },
];

// ─── Engagement boundaries ─────────────────────────────────────────────────
export const ENGAGEMENT_INCLUDES = [
  'Design and implementation of the five-layer pipeline',
  'Knowledge repository setup with governance',
  'MCP context server deployment',
  'Studio-adapted skill library',
  'Integration with existing studio systems',
  'Team training for developers and tech leads',
  'Success measurement and reporting',
];

export const ENGAGEMENT_EXCLUDES = [
  { title: 'Building or fine-tuning custom AI models',    body: 'We integrate frontier and open-weight models; we do not train custom ones.' },
  { title: 'Replacing engineering leadership',            body: 'We build infrastructure that amplifies your team; we do not make architectural decisions for you.' },
  { title: 'Direct game feature development',             body: 'We build the infrastructure that supports feature development, not the features themselves.' },
  { title: '24/7 support',                                 body: 'Support hours defined by tier. Business hours standard, extended hours available for enterprise engagements.' },
  { title: 'Liability for AI-generated code correctness', body: 'Human review remains the developer’s responsibility. We build the infrastructure that makes review efficient.' },
  { title: 'Autonomous code modification',                body: 'No layer autonomously modifies code without human approval. Regardless of client requests.' },
];

export const ENGAGEMENT_REFERS = [
  'Audio engineering AI adoption',
  'Netcode-specific optimization',
  'Engine source modification work',
  'Legal / compliance certification',
  'Rendering pipeline specialization',
];

// ─── Why this approach works ───────────────────────────────────────────────
export const DIFFERENTIATORS = [
  { title: 'Deep gamedev specialization', body: 'Not adapting generic frameworks. Built by engineers who have shipped games and know what production actually requires.' },
  { title: 'Layered architecture',         body: 'Not throwing AI at every problem. Deliberate design about where each capability belongs and why.' },
  { title: 'Governance-first',             body: 'Knowledge updates flow through PR review. No developer silently breaks conventions. No rogue changes to shared knowledge.' },
  { title: 'Vendor-neutral',               body: 'We work with the AI stack your studio prefers. We advise on trade-offs; we do not resell any vendor.' },
  { title: 'Open standards',               body: 'Everything built on MCP, Git, and standard infrastructure. No proprietary lock-in.' },
  { title: 'Honest measurement',           body: 'Baselines captured, targets defined, results reported. If it does not pay back, we tell you and adjust.' },
];

export const WHAT_WE_DONT_CLAIM = [
  'To eliminate the need for senior engineers',
  'Autonomous code generation',
  'Proprietary AI models',
  'That the components we build are unique (many are open source; we use them where appropriate)',
  'Instant transformation — real value takes months to compound',
];

// ─── Two kinds of AI access ────────────────────────────────────────────────
// The seat/API distinction is the same at every major vendor. Both modes are
// used side-by-side in the deployed system; each is used where it fits.
export const TWO_MODES = [
  {
    mode: 'Interactive',
    forWhom: 'Developers',
    label: 'Seats',
    body: 'Each developer has a commercial AI seat and runs a coding assistant on their workstation. When they want help writing code, they get it through this seat. Fixed monthly cost per developer, unlimited use within reasonable rate limits, human always in the loop.',
    examples: 'Claude for Work · ChatGPT Enterprise · Gemini for Google Workspace',
    billing: '~€30-40 per developer per month, paid directly to the vendor',
    usedIn: 'Layer 1 (write-time) · Layer 3 (submit-time, if seat-based)',
  },
  {
    mode: 'Programmatic',
    forWhom: 'Automation',
    label: 'API',
    body: 'A server-side worker calls the vendor’s API directly when events happen — a submit lands, a build fails, a scheduled analysis runs. Uses an API key, not a seat. Per-token pricing, predictable, designed for 24/7 machine access and structured output.',
    examples: 'Anthropic API · OpenAI API · Google AI API (or via Bedrock / Vertex / Azure OpenAI)',
    billing: 'Per-token, typically with a Zero Data Retention addendum for IP protection',
    usedIn: 'Layer 3 (if API-based) · Layer 4 (post-submit review) · Layer 5 (continuous evolution)',
  },
];

export const WHY_SPLIT = 'Seats and API keys are different products designed for different uses. Seats assume a human at a keyboard: session-based auth, rate limits sized for interactive use, conversational streaming output. API keys assume server-side automation: long-lived credentials, volume rate limits, structured output guaranteed by schema, terms of service that explicitly permit programmatic access. Using seats for server-side automation would work briefly, then fail at scale and potentially violate terms of service. Using API for interactive developer work would work but cost significantly more than seats for the same volume. Each mode is used where it fits.';

// ─── Deployment topology (what lives where) ────────────────────────────────
export const DEPLOYMENT_INSIDE_STUDIO = [
  { name: 'Knowledge repository',        detail: 'Git, on the studio’s existing Git infrastructure' },
  { name: 'MCP Context Server',          detail: 'One small VM · 2 vCPU / 4GB RAM' },
  { name: 'Automation Worker',           detail: 'One small VM · 2 vCPU / 4GB RAM' },
  { name: 'Existing studio systems',     detail: 'Perforce · Swarm · Jira · Slack · CI (unchanged)' },
];
export const DEPLOYMENT_INSIDE_VENDOR = [
  { name: 'Interactive AI seats',        detail: 'Vendor-hosted (Claude for Work · ChatGPT Enterprise · Gemini)' },
  { name: 'Programmatic AI API',         detail: 'Vendor-hosted or routed via AWS Bedrock / Google Vertex / Azure OpenAI' },
];
export const DEPLOYMENT_ADDED = 'Two small VMs. That is the entire additional infrastructure footprint. Everything else uses infrastructure the studio already runs.';

// ─── Who pays what (cost breakdown) ────────────────────────────────────────
export const COST_FIXED = [
  {
    line: 'AI seats (interactive use)',
    who: 'Studio → vendor',
    price: '~€30-40 / developer / month',
    note: 'Paid directly, no markup. Number of seats matches the developers who need interactive AI assistance.',
  },
  {
    line: 'Infrastructure hosting',
    who: 'Studio → cloud or self',
    price: '~€30-100 / month total',
    note: 'Two small VMs. Depends on your chosen hosting.',
  },
  {
    line: 'Optimization retainer (optional)',
    who: 'Studio → us',
    price: '~€2,000-15,000 / month',
    note: 'Scales with studio size. Ongoing knowledge evolution, integration maintenance, system optimization.',
  },
];
export const COST_VARIABLE = [
  {
    line: 'Layer 3 API (if API-based)',
    price: '€50-150 / month',
    note: 'For a 50-developer studio at ~2,000 submits / month. Zero if seat-based.',
  },
  {
    line: 'Layer 4 (post-submit review)',
    price: '€300-800 / month',
    note: 'For a 50-developer studio. Scales roughly linearly with submit volume.',
  },
  {
    line: 'Layer 5 (continuous evolution)',
    price: '€30-100 / month',
    note: 'Weekly / monthly batch jobs.',
  },
];
export const COST_VARIABLE_TOTAL = 'Total API charges typically €400-1,000 / month for a 50-developer studio; €1,500-4,000 for a 200-developer studio.';

export const COST_ONE_TIME = [
  {
    line: 'AI Readiness Audit',
    price: '~€4,000-35,000',
    note: 'Fixed-fee, one-time. Written report you keep regardless of next steps.',
  },
  {
    line: 'Setup & Integration',
    price: '~€10,000-130,000',
    note: 'Fixed-fee, one-time. Infrastructure deployment, integration, knowledge construction, skill library, training.',
  },
];

export const COST_DONT_CHARGE = [
  'We do not mark up vendor pricing. Studio pays the AI vendor directly for seats and API charges.',
  'We do not charge for open-source components (official Perforce MCP, community MCPs, standard linters). We configure and integrate; you do not pay for the software.',
];

// ─── Deployment & operations ───────────────────────────────────────────────
export const OPS_WE_DEPLOY_SETUP = [
  'Knowledge repository created and populated',
  'MCP context server deployed and configured',
  'Automation worker deployed and configured',
  'Perforce (or Plastic / Git) triggers installed',
  'Review tool integrations configured',
  'Developer workstations configured',
  'Skill library installed and tested',
  'Team training completed',
];
export const OPS_WE_MAINTAIN_RETAINER = [
  'Knowledge evolution based on telemetry',
  'New capabilities added as needed',
  'Cost monitoring and optimization',
  'Vendor-platform update integration',
  'Quarterly ROI reports',
];
export const OPS_STUDIO_OPERATES = 'The studio owns and operates the two VMs after handover (standard sysadmin work). We maintain the knowledge content, skill library, and configuration through the retainer. If the retainer ends, everything continues to work — studio owns all infrastructure, all code, all configuration. Zero vendor lock-in on us.';
export const OPS_WE_DONT_OPERATE = 'We do not host anything on our infrastructure. Everything lives in the studio’s environment. This is deliberate: better for IP protection, better for compliance (your security team can audit exactly what runs where), better for your long-term autonomy.';

// ─── Layer 3 detailed content ──────────────────────────────────────────────
export const LAYER3_HEADLINE = 'Not another code review. The metadata, context, and coherence that make submits worth reviewing.';
export const LAYER3_INTRO = 'Layer 3 runs when a developer initiates the operation that sends their code to the shared repository. In Perforce, that is `p4 submit`. In Git, that is `git push` or opening a pull request. It is not pre-commit — Git commits are local and frequent, and running AI checks on every commit would be excessive. Layer 3 focuses on what surrounds the code, not the code itself.';

export const LAYER3_VERIFICATION = [
  {
    icon: 'file-text',
    title: 'Changelist description quality',
    items: [
      'Description follows the studio’s template',
      'Description accurately reflects what changed in the diff',
      'No placeholder descriptions ("wip", "fix", "misc changes") without follow-up',
      'Intent is captured, not just mechanics',
    ],
  },
  {
    icon: 'clipboard-check',
    title: 'Ticket linkage integrity',
    items: [
      'Referenced ticket exists in Jira, Linear, or your tracker',
      'Ticket is in an appropriate state (not closed, assigned to submitter)',
      'Ticket description aligns with what the code actually does',
      'Missing ticket linkage flagged when required by studio policy',
    ],
  },
  {
    icon: 'users',
    title: 'Reviewer assignment',
    items: [
      'Reviewers assigned automatically based on file ownership from the knowledge layer',
      'Required approvers for touched modules present',
      'Cross-team reviews requested when appropriate',
      'No self-approval situations that violate studio policy',
    ],
  },
  {
    icon: 'lock',
    title: 'Path safety',
    items: [
      'Engine code modifications flagged if unauthorized',
      'Third-party code changes require legal or licensing review flags',
      'Protected paths (console SDK, restricted modules) require explicit justification',
      'Cross-cutting changes that touch multiple owned modules trigger acknowledgment',
    ],
  },
  {
    icon: 'route',
    title: 'Scope coherence',
    items: [
      'Changes align with the stated intent',
      'Unrelated changes not mixed into a single changelist (a "fix bug X" that also refactors module Y triggers a split suggestion)',
      'CL size within reasonable bounds for meaningful review',
    ],
  },
];

export const LAYER3_DESC_GEN_INTRO = 'One of Layer 3’s most useful capabilities is generating changelist descriptions rather than merely validating them. Developers routinely write minimal descriptions because synthesizing changes into prose is work they would rather skip. Tech leads then spend disproportionate time reading diffs to understand intent. Description quality is one of the highest-leverage improvements possible in a development pipeline.';

export const LAYER3_DESC_GEN_EXAMPLE = `Proposed description:

Implements JIRA-1234: damage-over-time ability for wizard class.

- Adds DoTAbility with configurable tick interval and duration
- Integrates with existing buff system for effect stacking
- Includes network replication following studio conventions
- Tests cover single-target, area effect, and dispel scenarios

Reviewers assigned: @tech-lead-gameplay, @tech-lead-networking
Ticket status: In Progress → will move to In Review on submit`;

export const LAYER3_DESC_GEN_APPROACHES = [
  {
    label: 'Approach A',
    name: 'AI generates, developer confirms',
    body: 'AI writes the description from the diff and the ticket. Developer confirms or edits before submit proceeds. Minimum friction, highest consistency.',
    when: 'Teams with less senior developers, or where description quality is a persistent problem.',
  },
  {
    label: 'Approach B',
    name: 'Developer writes, AI validates',
    body: 'Developer writes description as usual. AI checks alignment with diff, template adherence, and completeness. AI warns only; developer authorship preserved.',
    when: 'Teams where every submit deserves author-written prose.',
  },
  {
    label: 'Approach C',
    name: 'Hybrid, based on developer effort',
    body: 'If developer wrote substantial description, AI validates. If developer wrote minimal placeholder, AI proposes a full description. Respects developer autonomy while catching lazy submissions.',
    when: 'Most studios pick this one after seeing the trade-offs.',
    recommended: true,
  },
];

export const LAYER3_ADVISORY = 'Layer 3 primarily provides advisory feedback. Developers see warnings, can address them or proceed with justification. Blocking behavior is reserved for critical issues: attempted modifications to protected paths without required flags, missing required approvers for regulated code, ticket references that fail integrity checks, submits that violate explicit path restrictions defined in the knowledge layer. Everything else is advisory. Tech leads configure which categories block during Setup, based on studio risk tolerance.';

export const LAYER3_IMPL_OPTIONS = [
  {
    label: 'Option A',
    name: 'Via developer’s AI seat',
    body: 'The pre-submit hook invokes the developer’s AI coding assistant locally. The developer’s seat handles the AI call. No additional cost per submit. Simpler to configure. Uses whatever seat quota the developer has.',
    bestFor: 'Studios with generous seat allocations, teams preferring simplicity, straightforward workflows.',
    cost: '€0 incremental / submit',
  },
  {
    label: 'Option B',
    name: 'Via studio’s AI API key',
    body: 'The pre-submit hook makes a direct API call using the studio’s API key. Structured output guaranteed by schema. Independent of seat state. Better observability for compliance auditing.',
    bestFor: 'Studios with strict compliance requirements, high submit volumes, or preference for centralized cost tracking.',
    cost: '~€0.02-0.05 / submit',
  },
];
export const LAYER3_IMPL_NOTE = 'Both options produce equivalent quality of analysis. The choice is about operational preference, not capability. Most studios choose Option A initially and migrate to Option B if compliance or observability needs grow.';

export const LAYER3_NOT = [
  { title: 'Not another code quality review',    body: 'Layer 1 handles quality at write time; Layer 4 handles deep analysis post-submit. Layer 3 is about submit-readiness, not code correctness.' },
  { title: 'Not a gate that developers battle',  body: 'Well-configured, Layer 3 saves developers time by handling metadata construction automatically. If developers experience it as bureaucratic friction, configuration is wrong.' },
  { title: 'Not autonomous',                      body: 'Even auto-generated descriptions require developer confirmation before the submit proceeds. AI never submits code without human decision.' },
  { title: 'Not required for every changelist',  body: 'Trivial changes (typo fixes, comment updates) can be exempted from full Layer 3 processing. Configurable during Setup.' },
];

// ─── Plain-terms summary ───────────────────────────────────────────────────
export const PLAIN_TERMS_LINES = [
  'Developers work as they always do, with a smarter AI assistant that knows your studio’s rules.',
  'A small server sits inside your network holding your studio’s collective knowledge and serving it up when needed.',
  'Another small server watches for events — submits, build failures, weekly schedules — and does the deeper analysis that would otherwise consume senior engineering time.',
  'The AI vendor hosts the model. You keep the code, the knowledge, and the infrastructure.',
];
export const PLAIN_TERMS_TAGLINE = 'Two subscriptions. Two small servers. Five layers that know when to run and when to stay quiet.';

// ─── Segment callouts (anchor sections on the homepage) ────────────────────
// Kept minimal; not their own pages anymore.
export const SEGMENTS = [
  {
    id: 'indies',
    icon: 'zap',
    size: '10-30 developers',
    title: 'Indies & Small Studios',
    body: 'Single project, tight team, moving fast. Lighter governance surface; faster onboarding and shadow-AI elimination are the priority.',
  },
  {
    id: 'mid',
    icon: 'layers',
    size: '30-80 developers',
    title: 'Mid-Size Studios',
    body: 'Multiple projects, dedicated tech leads, formal standards. The scale where a five-layer pipeline pays back fastest. Most common engagement.',
    highlighted: true,
  },
  {
    id: 'aaa',
    icon: 'building',
    size: '80-300+ developers',
    title: 'AAA & Publishers',
    body: 'Multi-site teams, publisher relationships, strict compliance. Tier 3 or 4 privacy, hardened governance, controlled multi-site rollout.',
  },
];
