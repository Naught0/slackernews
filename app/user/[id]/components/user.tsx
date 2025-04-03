import { BiCalendar } from "react-icons/bi";
import { GoTriangleUp } from "react-icons/go";
import { LiaHackerNews } from "react-icons/lia";
import { MainItemContainer } from "~/app/components/main-item-container";
import sanitizeHtml from "sanitize-html";

import { SkeleWrap } from "~/components/ui/skeleton";

const formatNumber = Intl.NumberFormat();
export default function User({
  user,
  loading,
  className,
}: {
  user: HNUser;
  loading?: boolean;
  className?: string;
}) {
  return (
    <MainItemContainer className={className}>
      <p className="inline-flex items-center gap-1.5 text-xl lg:text-2xl">
        <SkeleWrap loading={loading}>
          {user.id}
          <a
            href={`https://news.ycombinator.com/user?id=${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LiaHackerNews />
          </a>
        </SkeleWrap>
      </p>
      <p className="inline-flex items-center gap-0">
        <SkeleWrap loading={loading}>
          since {new Date(user.created * 1000).toLocaleDateString()}
        </SkeleWrap>
      </p>
      <p>
        <SkeleWrap loading={loading}>
          <GoTriangleUp className="inline" />
          {formatNumber.format(user.karma)} points
        </SkeleWrap>
      </p>
      <p>
        <SkeleWrap loading={loading}>
          {formatNumber.format(user.submitted.length)} submission
          {user.submitted.length !== 1 && "s"}
        </SkeleWrap>
      </p>

      <p
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(user.about) }}
        className="text-muted-foreground"
      ></p>
    </MainItemContainer>
  );
}
