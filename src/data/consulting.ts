// Shared data + constants for the AI-Setup-Consulting section.
// All routes stay namespaced under /AI-Setup-Consulting/ (the site root is the portfolio).

export const SITE = 'https://toamig.com';
export const BRAND = 'Miguel Vieira';
export const CALENDLY_URL = 'https://calendly.com/migueltechlead-support/30min';
export const EMAIL = 'support@migueltechlead.pt';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/toamig';
export const CITY = 'Lisbon, Portugal';

export const BASE = '/AI-Setup-Consulting';
export const BOOK_PATH = `${BASE}/discovery-call`;
export const OG_IMAGE = `${SITE}/og/ai-setup-consulting.png`;

// ── Primary navigation (route-based, shared across every page) ─────────────
export const NAV = [
  { href: `${BASE}/services`,   label: 'Services' },
  { href: `${BASE}/approach`,   label: 'Approach' },
  { href: `${BASE}/technology`, label: 'Technology' },
  { href: `${BASE}/about`,      label: 'About' },
];

// Technologies we build on and integrate with. Names, not client logos.
export const STACK = ['Unreal Engine', 'C++', 'Perforce', 'Plastic SCM', 'Anthropic', 'MCP'];

// ── The four-phase engagement (Discovery -> Audit -> Setup -> Retainer) ────
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
      'Codebase review, workflow mapping, shadow AI scan',
      'Written report with a quantified ROI estimate for your team',
      'Standalone value: you keep the report regardless of next steps',
    ],
  },
  {
    step: '03',
    title: 'Setup & Integration',
    meta: '3-16 weeks',
    points: [
      'Brain, MCP servers, automation, integration',
      'Team training included',
      'Before and after metrics measured',
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

// ── What we build (infrastructure cards on the homepage) ───────────────────
export const BUILD_CARDS = [
  {
    icon: 'cpu',
    title: 'Centralized brain',
    body: 'A governed knowledge layer holding your coding standards, architecture, and conventions. Read-only for developers. Updated only through approved automation.',
  },
  {
    icon: 'server',
    title: 'Custom MCP servers',
    body: 'Purpose-built integrations for Perforce, Plastic SCM, build systems, and review tools. Safe operations with audit logs. Not a bash wrapper.',
  },
  {
    icon: 'git-pull-request',
    title: 'Automated review pipelines',
    body: 'Server-side AI review that runs on every submit. Posts to Swarm, Jira, or your review tool. Catches issues before they reach senior reviewers.',
  },
  {
    icon: 'lock',
    title: 'Privacy tier selection',
    body: 'Four data-protection tiers, from commercial API to self-hosted sandboxes. We recommend and configure the right one for your IP sensitivity.',
  },
];

// ── What it automates: concrete work taken off engineers, grouped by stage ─
// Everything ships human-in-the-loop: AI drafts and proposes, engineers approve.
export const AUTOMATIONS = [
  {
    icon: 'terminal',
    title: 'Authoring',
    items: [
      'Convention-aware boilerplate that respects your gameplay framework and naming',
      'Codebase Q&A: "where is damage applied?" answered from the brain, not a senior',
    ],
  },
  {
    icon: 'git-pull-request',
    title: 'Review & submit',
    items: [
      'Automated review on every submit, catching convention and architecture drift',
      'Perforce changelist and PR descriptions drafted from the diff',
      'Plain-English summaries of large changelists for reviewers',
    ],
  },
  {
    icon: 'gauge',
    title: 'Build & CI',
    items: [
      'Build-failure triage: reads the failing log, localizes the cause, opens a fix changelist for review',
      'Flaky and failing test triage, clustered by likely cause',
    ],
  },
  {
    icon: 'book-open',
    title: 'Docs & knowledge',
    items: [
      'Documentation drafted and kept in sync with the code',
      'Release notes and changelogs generated from merged changelists',
    ],
  },
  {
    icon: 'repeat',
    title: 'Testing & refactors',
    items: [
      'Test scaffolding for new gameplay code',
      'Large mechanical refactors and API-deprecation sweeps applied consistently',
    ],
  },
  {
    icon: 'clipboard-check',
    title: 'Project tracking',
    items: [
      'Jira tickets drafted from a change, a bug, or a discussion',
      'Incoming issue triage: routed, labeled, and summarized',
    ],
  },
];

// ── Service packages (deep-dive pages + overview) ──────────────────────────
export const SERVICES = [
  {
    id: 'audit',
    icon: 'search',
    title: 'AI Readiness Audit',
    duration: '1-3 weeks',
    cadence: 'Fixed-fee',
    href: `${BASE}/services/audit`,
    blurb: 'Codebase review, workflow mapping, and a shadow AI scan. You get a written report with a recommended privacy tier, a phased roadmap, and a quantified ROI estimate you keep regardless of next steps.',
  },
  {
    id: 'setup',
    icon: 'settings',
    title: 'Setup & Integration',
    duration: '3-16 weeks',
    cadence: 'Fixed-fee',
    href: `${BASE}/services/setup`,
    blurb: 'Central brain, custom MCP servers, automated review pipelines, permissions, and cost monitoring. Team training included. Built module by module, with before and after metrics.',
  },
  {
    id: 'retainer',
    icon: 'repeat',
    title: 'Optimization Retainer',
    duration: 'monthly',
    cadence: 'Ongoing',
    href: `${BASE}/services/retainer`,
    blurb: 'Brain evolution, new Claude capabilities folded in as they ship, cost optimization, developer office hours, and quarterly ROI reports as your codebase changes.',
  },
];

// ── Segment summaries (homepage auto-segmentation + cross-links) ───────────
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
    benefits: ['Cross-project knowledge', '40-60% review time reduction', 'Institutional memory'],
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

// ── The four privacy tiers (technology page + AAA references) ───────────────
export const PRIVACY_TIERS = [
  {
    tier: 'Tier 1',
    title: 'Claude for Work / Enterprise',
    body: 'Commercial terms. Anthropic does not train on your data. Suitable for around 80% of studios. Fastest to deploy.',
    when: 'Default for most teams without heavy NDA or console-SDK constraints.',
  },
  {
    tier: 'Tier 2',
    title: 'Claude API with Zero Data Retention',
    body: 'Direct API access under commercial terms. Logs are processed only for real-time abuse detection, then discarded. No chat content, metadata, or request details persisted.',
    when: 'Studios with custom tooling or licensed IP that need tighter log retention.',
  },
  {
    tier: 'Tier 3',
    title: 'AWS Bedrock or Google Vertex AI',
    body: 'Claude runs on your cloud provider infrastructure. Your code never touches Anthropic infrastructure. Zero-friction compliance for teams already on AWS or GCP.',
    when: 'AAA and publishers with strict procurement and data-residency requirements.',
  },
  {
    tier: 'Tier 4',
    title: 'Self-hosted sandboxes with MCP tunnels',
    body: 'Isolated developer sandboxes connected to Claude through controlled MCP tunnels. Maximum containment for the most IP-sensitive work.',
    when: 'The strictest console-SDK and NDA environments where nothing leaves the perimeter.',
  },
];
