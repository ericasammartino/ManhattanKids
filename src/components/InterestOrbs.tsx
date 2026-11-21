import Link from "next/link";
import {
  BookOpen,
  Compass,
  LayoutGrid,
  Palette,
  Bot,
  Volleyball,
} from "lucide-react";

type Props = {
  /** Where interest links should open. Defaults to homepage afterschool browse. */
  resultsPath?: string;
};

const INTERESTS = [
  {
    label: "Arts & Creativity",
    category: "Arts & Creativity",
    Icon: Palette,
    bg: "#fce7ef",
    border: "#e8a0b8",
    icon: "#c45a7a",
  },
  {
    label: "Sports & Movement",
    category: "Sports & Movement",
    Icon: Volleyball,
    bg: "#fef3c7",
    border: "#e8c96a",
    icon: "#c9a227",
  },
  {
    label: "STEM",
    category: "STEM",
    Icon: Bot,
    bg: "#ede9fe",
    border: "#c4b5fd",
    icon: "#7c6bc4",
  },
  {
    label: "Play & Exploration",
    category: "Play & Exploration",
    Icon: Compass,
    bg: "#dcfce7",
    border: "#86d4a0",
    icon: "#3d9b5f",
  },
  {
    label: "Learning & Enrichment",
    category: "Learning & Enrichment",
    Icon: BookOpen,
    bg: "#ffedd5",
    border: "#f0b878",
    icon: "#d4833a",
  },
  {
    label: "Explore All",
    category: null,
    Icon: LayoutGrid,
    bg: "#ecfdf5",
    border: "#6ee7b7",
    icon: "#059669",
  },
] as const;

export default function InterestOrbs({ resultsPath = "/" }: Props) {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-x-8 gap-y-7 sm:gap-x-10 md:gap-x-12">
      {INTERESTS.map(({ label, category, Icon, bg, border, icon }, i) => {
        const href = category
          ? `${resultsPath}?category=${encodeURIComponent(category)}&neighborhood=all`
          : `${resultsPath}?neighborhood=all`;
        return (
          <Link
            key={label}
            href={href}
            className="interest-orb group flex w-[96px] flex-col items-center gap-2.5 animate-soft-pop sm:w-[104px]"
            style={{ animationDelay: `${80 + i * 40}ms` }}
          >
            <span
              className="interest-orb-circle flex h-[76px] w-[76px] items-center justify-center rounded-full border-[2.5px]"
              style={{ background: bg, borderColor: border }}
            >
              <Icon
                className="h-7 w-7"
                strokeWidth={1.75}
                style={{ color: icon }}
              />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
