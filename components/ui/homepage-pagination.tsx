import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

export function HomepagePagination({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams?.["page"] ?? "1");
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={`/?page=${page - 1}`} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href={`/?page=${page + 1}`} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
