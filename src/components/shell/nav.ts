import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Globe,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Plug,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Feature not shipped yet — rendered muted with a "soon" tag. */
  soon?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/**
 * One entry per product module (mirrors the epics in docs/product/feature-set.md).
 * Flip `soon` off as each epic ships.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Manage",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Calendar", href: "/calendar", icon: CalendarDays, soon: true },
      { label: "Reservations", href: "/reservations", icon: Users, soon: true },
      { label: "Rentals", href: "/rentals", icon: Home },
      { label: "Payments", href: "/payments", icon: CreditCard, soon: true },
    ],
  },
  {
    label: "Connect",
    items: [
      { label: "Inbox", href: "/inbox", icon: Inbox, soon: true },
      {
        label: "Automations",
        href: "/automations",
        icon: MessageSquareText,
        soon: true,
      },
      { label: "Channels", href: "/channels", icon: Plug, soon: true },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Booking site", href: "/booking-site", icon: Globe, soon: true },
      { label: "Operations", href: "/operations", icon: Wrench, soon: true },
      { label: "Analytics", href: "/analytics", icon: BarChart3, soon: true },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  soon: true,
};
