import MessageBubble from "./MessageBubble";

export default function MessageGroup() {
  return (
    <div className="space-y-5">
      <MessageBubble message="Hey Rafia 👋" time="10:18 AM" />

      <MessageBubble
        message="The new dashboard design looks really clean."
        time="10:19 AM"
      />

      <MessageBubble
        own
        message="Thank you 😊 I'm trying to make it look like Discord + Linear."
        time="10:20 AM"
      />

      <MessageBubble
        own
        message="Next I'll connect Socket.io."
        time="10:22 AM"
      />

      <MessageBubble message="That's awesome 🔥" time="10:24 AM" />

      <MessageBubble
        message="Can't wait to test realtime messaging."
        time="10:24 AM"
      />
    </div>
  );
}
