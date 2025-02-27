import { LiaHackerNews } from "react-icons/lia";

export function HNLink(props: { id: string | number }) {
  return (
    <a
      href={`https://news.ycombinator.com/item?id=${props.id}`}
      className="text-2xl"
      rel="noopener noreferrer"
      target="_blank"
    >
      <LiaHackerNews />
    </a>
  );
}
