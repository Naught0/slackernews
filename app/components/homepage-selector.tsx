"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import React, { useMemo, JSX, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoArrowUpRight, GoBriefcase } from "react-icons/go";
import { SlPresent } from "react-icons/sl";
import { GoClock } from "react-icons/go";
import { BsQuestionLg } from "react-icons/bs";
import { HiOutlinePresentationChartLine } from "react-icons/hi";
import { IconType } from "react-icons/lib";

const Container = (props: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center gap-1.5">{props.children}</span>
  );
};
const HomepageLink = ({
  icon,
  children,
}: {
  icon: IconType;
  children: React.ReactNode;
}) => (
  <Container>
    {icon({ className: "inline" })} {children}
  </Container>
);

const Top = () => <HomepageLink icon={GoArrowUpRight}>top</HomepageLink>;
const Best = () => <HomepageLink icon={SlPresent}>best</HomepageLink>;
const New = () => <HomepageLink icon={GoClock}>new</HomepageLink>;
const Ask = () => <HomepageLink icon={BsQuestionLg}>ask</HomepageLink>;
const Show = () => (
  <HomepageLink icon={HiOutlinePresentationChartLine}>show</HomepageLink>
);
const Job = () => <HomepageLink icon={GoBriefcase}>job</HomepageLink>;

const compMap: Record<
  string,
  { component: () => JSX.Element; type: HNPWAFeedType | "best" }
> = {
  top: { type: "news", component: Top },
  ask: { type: "ask", component: Ask },
  best: { type: "best", component: Best },
  jobs: { type: "jobs", component: Job },
  new: { type: "newest", component: New },
  show: { type: "show", component: Show },
};
const MenuItem = (props: { children: React.ReactNode }) => (
  <DropdownMenuItem className="px-0 py-0">{props.children}</DropdownMenuItem>
);
const MenuItemLink = (props: { href: string; children: React.ReactNode }) => {
  return (
    <Link href={props.href} className="w-full px-2 py-1.5">
      {props.children}
    </Link>
  );
};
export function HomepageSelector() {
  const pathname = usePathname();
  const current = useMemo(() => {
    const thing = pathname.split("/").slice(-1)[0] as HNHomepageType;

    return compMap?.[thing] ?? compMap["top"];
  }, [pathname]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {createElement(current.component)}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <MenuItem>
          <MenuItemLink href="/">
            <Top />
          </MenuItemLink>
        </MenuItem>
        <MenuItem>
          <MenuItemLink href="/best">
            <Best />
          </MenuItemLink>
        </MenuItem>
        <MenuItem>
          <MenuItemLink href="/newest">
            <New />
          </MenuItemLink>
        </MenuItem>
        <MenuItem>
          <MenuItemLink href="/ask">
            <Ask />
          </MenuItemLink>
        </MenuItem>
        <MenuItem>
          <MenuItemLink href="/show">
            <Show />
          </MenuItemLink>
        </MenuItem>
        <MenuItem>
          <MenuItemLink href="/jobs">
            <Job />
          </MenuItemLink>
        </MenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
