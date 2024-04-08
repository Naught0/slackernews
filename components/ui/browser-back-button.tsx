"use client";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export const BrowserBackButton = () => {
  const { back } = useRouter();

  return (
    <Button variant={"outline"} onClick={back}>
      <ArrowLeftIcon />
    </Button>
  );
};
