import { PersonIcon } from "@radix-ui/react-icons";
import { BiCalendar } from "react-icons/bi";
import { GoTriangleUp } from "react-icons/go";
import { MainItemContainer } from "~/app/components/main-item-container";

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
      <p className="inline-flex flex-grow-0 items-center gap-1 text-lg lg:text-xl">
        <SkeleWrap loading={loading}>
          <PersonIcon /> {user.id}
        </SkeleWrap>
      </p>
      <p className="gap0 inline-flex items-center">
        <SkeleWrap loading={loading}>
          <BiCalendar /> {new Date(user.created * 1000).toLocaleDateString()}
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
    </MainItemContainer>
  );
}
