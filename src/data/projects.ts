/**
 * Tier-1 OSS portfolio (the credibility anchors).
 * Order = display order. Edit freely.
 */
export type Project = {
  name: string;
  tagline: string;          // one-line "what it is"
  description: string;      // 2-3 sentences "what + why"
  href: string;             // github URL
  tags: string[];           // tech / domain badges
  stars?: number;           // optional; fetched manually or via build-time API
};

export const projects: Project[] = [
  {
    name: "opsbench",
    tagline: "Evidence-driven multi-agent incident response for Kubernetes",
    description:
      "NIST SP 800-86 compliant chain-of-custody for SRE post-mortems. Parallel hypothesis investigation by specialized agents, with cryptographic sealing of evidence rounds. Built for storage/network/k8s incidents where state must be defensible.",
    href: "https://github.com/shaiknoorullah/opsbench",
    tags: ["k8s", "incident-response", "multi-agent", "forensics"],
  },
  {
    name: "SSHield",
    tagline: "SSH config TUI — opinionated key + host + jumphost management",
    description:
      "Terminal UI for managing ~/.ssh/config: hosts, identities, jumphosts, ProxyCommand chains, and ControlMaster sockets. Targets developers who maintain dozens of SSH endpoints across personal, work, and infrastructure environments.",
    href: "https://github.com/shaiknoorullah/SSHield",
    tags: ["tui", "rust", "developer-tools"],
  },
  {
    name: "agenthive",
    tagline: "Encrypted P2P mesh for AI coding agents",
    description:
      "WireGuard-based overlay for agent-to-agent communication during multi-agent code-gen sessions. Homebrew tap available. Solves the 'agents need to share work product without going through a centralized broker' problem.",
    href: "https://github.com/shaiknoorullah/agenthive",
    tags: ["p2p", "wireguard", "agentic-systems"],
  },
  {
    name: "mation-engine",
    tagline: "LLVM for conditional logic — implementation of RFC-002",
    description:
      "Compiles declarative rules (Rego-adjacent) into optimized evaluation graphs. Target use: policy engines, feature flags, event-routing, complex form validation. Reference impl backing a published RFC.",
    href: "https://github.com/shaiknoorullah/mation-engine",
    tags: ["compiler", "rules-engine", "rfc"],
  },
  {
    name: "fusync",
    tagline: "Redis-backed async orchestration",
    description:
      "Lightweight workflow primitive for distributed Node.js services. Lower ceremony than Temporal, higher reliability than ad-hoc Bull queues. Ships with backoff, idempotency keys, and DAG support.",
    href: "https://github.com/shaiknoorullah/fusync",
    tags: ["typescript", "redis", "workflows"],
  },
  {
    name: "hyprfoil",
    tagline: "Rust-based tabs for Hyprland",
    description:
      "Adds Firefox/Zen-style horizontal tabs to Hyprland workspaces. Native Wayland, no compositor patches. For people who live in Hyprland but miss the browser-tab metaphor for window management.",
    href: "https://github.com/shaiknoorullah/hyprfoil",
    tags: ["rust", "wayland", "hyprland"],
  },
  {
    name: "kall",
    tagline: "Bash command center — alias + script discoverability",
    description:
      "TUI menu over your collected bash aliases and scripts. Eliminates 'I wrote that helper 6 months ago, what was it called'. Lives in your dotfiles, surfaces what you already have.",
    href: "https://github.com/shaiknoorullah/kall",
    tags: ["bash", "tui", "developer-tools"],
  },
  {
    name: "serverforge",
    tagline: "Server provisioning toolkit",
    description:
      "Opinionated provisioning for single-host VPS workloads. Hardened SSH, UFW, Docker, Traefik, restic backups out of the box. Used internally on contabo-mum-1; productized for others doing the same pattern.",
    href: "https://github.com/shaiknoorullah/serverforge",
    tags: ["ansible", "infra", "single-host"],
  },
];
