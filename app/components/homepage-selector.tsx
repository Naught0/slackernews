"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoArrowUpRight, GoBriefcase } from "react-icons/go";
import { SlPresent } from "react-icons/sl";
import { GoClock } from "react-icons/go";
import { BsQuestionLg } from "react-icons/bs";
import { HiOutlinePresentationChartLine } from "react-icons/hi";

const Container = (props: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center gap-1.5">{props.children}</span>
  );
};
const Top = () => (
  <Container>
    <GoArrowUpRight className="inline" /> top
  </Container>
);
const Best = () => (
  <Container>
    <SlPresent className="inline" /> best
  </Container>
);
const New = () => {
  return (
    <Container>
      <GoClock className="inline" /> new
    </Container>
  );
};
const Ask = () => {
  return (
    <Container>
      <BsQuestionLg className="inline" /> ask
    </Container>
  );
};
const Show = () => {
  return (
    <Container>
      <HiOutlinePresentationChartLine className="inline" /> show
    </Container>
  );
};
const Job = () => {
  return (
    <Container>
      <GoBriefcase className="inline" /> job
    </Container>
  );
};
const compMap: Record<HNHomepageType, JSX.Element> = {
  ask: <Ask />,
  best: <Best />,
  top: <Top />,
  job: <Job />,
  new: <New />,
  show: <Show />,
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

    return compMap?.[thing] ?? <Top />;
  }, [pathname]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{current}</DropdownMenuTrigger>
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
          <MenuItemLink href="/new">
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
          <MenuItemLink href="/job">
            <Job />
          </MenuItemLink>
        </MenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
