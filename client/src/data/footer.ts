import type { IFooter } from "../types";

export const footerData: IFooter[] = [
    {
        title: "Pages",
        links: [
            { name: "Home", href: "/" },
            { name: "Generate", href: "/generate" },
            { name: "Recreate", href: "/generate" },
            { name: "Community", href: "/Community" },
        ]
    },
    {
        title: "Company",
        links: [
            { name: "About", href: "/About" },
            { name: "Contact Us", href: "/ContactUs" },
            //{ name: "Community", href: "#community" },//
            //{ name: "Careers", href: "#careers" },//
            //{ name: "About", href: "#about" },//
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", href: "/PrivacyPolicy" },
            { name: "Terms of Service", href: "/TermsOfService" },
        ]
    }
];