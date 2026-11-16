import Link from "next/link";
import {
  BookOpen,
  Compass,
  Clapperboard,
  LayoutGrid,
  Palette,
  Bot,
  Ticket,
  Volleyball,
} from "lucide-react";

const INTERESTS = [
  {
    label: "Arts & Creativity",
    href: "/afterschool?category=Arts%20%26%20Creativity&neighborhood=all",
    Icon: Palette,
    bg: "#fce7ef",
    border: "#e8a0b8",
    icon: "#c45a7a",
  },
  {
    label: "Sports & Movement",
    href: "/afterschool?category=Sports%20%26%20Movement&neighborhood=all",
    Icon: Volleyball,
    bg: "#fef3c7",
    border: "#e8c96a",
    icon: "#c9a227",
  },
  {
    label: "STEM",
    href: "/afterschool?category=STEM%20%26%20Discovery&neighborhood=all",
    Icon: Bot,
    bg: "#ede9fe",
    border: "#c4b5fd",
    icon: "#7c6bc4",
  },
  {
    label: "Museum & Culture",
    href: "/afterschool?category=Museums%20%26%20Culture&neighborhood=all",
    Icon: Ticket,
    bg: "#d1fae5",
    border: "#6ec9a8",
    icon: "#2f9e7c",
  },
  {
    label: "Play & Exploration",
    href: "/afterschool?category=Nature%20%26%20Outdoors&neighborhood=all",
    Icon: Compass,
    bg: "#dcfce7",
    border: "#86d4a0",
    icon: "#3d9b5f",
  },
  {
    label: "Entertainment",
    href: "/afterschool?category=Entertainment&neighborhood=all",
    Icon: Clapperboard,
    bg: "#ffe4e0",
    border: "#f0a090",
    icon: "#d4644a",
  },
  {
    label: "Learning & Enrichment",
    href: "/afterschool?category=Learning%20%26%20Enrichment&neighborhood=all",
    Icon: BookOpen,
    bg: "#ffedd5",
    border: "#f0b878",
    icon: "#d4833a",
  },
  {
    label: "Explore All",
    href: "/afterschool?neighborhood=all",
    Icon: LayoutGrid,
    bg: "#e0f2fe",
    border: "#7dd3fc",
    icon: "#3b9fd0",
  },
] as const;

export default function InterestOrbs() {
  return (
    <div className="flex flex-wrap justify-start gap-x-5 gap-y-6 md:gap-x-7">
      {INTERESTS.map(({ label, href, Icon, bg, border, icon }, i) => (
        <Link
          key={label}
          href={href}
          className="interest-orb group flex w-[88px] flex-col items-center gap-2.5 animate-soft-pop"
          style={{ animationDelay: `${80 + i * 40}ms` }}
        >
          <span
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[2.5px]"
            style={{ background: bg, borderColor: border }}
          >
            <Icon className="h-7 w-7" strokeWidth={1.75} style={{ color: icon }} />
          </span>
          <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
