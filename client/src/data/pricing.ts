import type { IPricing } from "../types";

export const pricingData: IPricing[] = [
    {
        name: "For Medical Students",
        price: 0,
        period: "Core Learning Tools",
        features: [
            "AI-powered clinical learning tips",
            "High-yield exam simulations",
            "Structured clinical algorithms",
            "Rapid revision summaries",
            "Mnemonics, acronyms & memory anchors"
        ],
        mostPopular: false
    },
    {
        name: "For Educators",
        price: 0,
        period: "Advanced Teaching Tools",
        features: [
            "Curriculum-aligned tip content",
            "Interest-driven peer collaboration hub",
            "Cognitive load optimized tips",
            "High Fidelity clinical case generator",
            "Instant high-yield pedagogical handouts",
            "Cohort learning & retention analysis"
        ],
        mostPopular: true
    },
    {
        name: "For Study Groups",
        price: 0,
        period: "Collaborative Learning Mode",
        features: [
            "Interest-based collaborative workspaces",
            "Gamified clinical case competitions-Soon",
            "Crowdsourced high-yield tip repository",
            "Real-time cohort synergy dashboards-Soon",
            "Group performance analytics-Soon"
        ],
        mostPopular: false
    }
];