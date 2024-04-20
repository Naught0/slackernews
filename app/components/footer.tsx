import { GitHubLogoIcon } from "@radix-ui/react-icons";
import React from "react";

export function Footer() {
  return (
    <footer className="prose prose-sm max-w-none bg-accent pb-16 pt-24 text-center text-sm dark:prose-invert lg:px-12 lg:pt-36">
      <p>
        <a href="https://github.com/naught0">naught0</a> made this
      </p>
      <p>
        w/ inspiration from <a href="https://hckrnws.com">hckrnws</a>
      </p>
      <p>
        and data from <a href="https://news.ycombinator.com/">hackernews</a>
      </p>
      <p>
        with absolutely no relation to{" "}
        <a href="https://slackernews.app/">
          <i>this</i> slackernews
        </a>{" "}
        which also seems cool
      </p>
      <span>
        <GitHubLogoIcon className="inline" />{" "}
        <a href="https://github.com/naught0/slackernews">source</a>
      </span>
    </footer>
  );
}
