import DateDivider from "./DateDivider";
import MessageGroup from "./MessageGroup";

export default function ChatMessages() {
  return (
    <div
      className="
        flex-1
        overflow-y-auto
        px-12
        py-10
        bg-[radial-gradient(circle_at_top,#1B2550_0%,#0B1120_45%,#0B1120_100%)]
        overflow-auto
      "
    >
      <DateDivider />

      <MessageGroup />
    </div>
  );
}
