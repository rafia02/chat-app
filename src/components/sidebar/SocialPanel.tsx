"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  MessageCircle,
  Search,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import {
  useAuthStore,
  useChatStore,
  useSocialStore,
  useUIStore,
  useUsersStore,
} from "@/stores";
import { formatConversationTime } from "@/lib/date";
import { Avatar, LoadingState } from "@/components/ui";
import type { User } from "@/types";

type PanelView = "people" | "requests";
type RequestTab = "received" | "sent";
type PeopleTab = "friends" | "allUsers";

function PersonAvatar({ user, online }: { user: User; online?: boolean }) {
  return (
    <div className="relative h-11 w-11 shrink-0">
      <Avatar
        name={user.name}
        src={user.avatar}
        className="h-11 w-11 text-xs"
      />
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111827] bg-emerald-400" />
      )}
    </div>
  );
}

function UserRow({
  user,
  onMessage,
  trailing,
  canMessage = true,
}: {
  user: User;
  onMessage: () => void;
  trailing?: React.ReactNode;
  canMessage?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-[#1B2233] py-3">
      <PersonAvatar user={user} online={user.status === "online"} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs capitalize text-slate-400">{user.status}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {trailing}
        {canMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#29344E] px-2.5 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:bg-indigo-600/20"
            aria-label={`Message ${user.name}`}
          >
            <MessageCircle size={15} />
            <span>Message</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function SocialPanel({ view }: { view: PanelView }) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const openChat = useUIStore((state) => state.openChat);
  const friends = useSocialStore((state) => state.friends);
  const receivedFriends = useSocialStore(
    (state) => state.receivedFriendRequests,
  );
  const sentFriends = useSocialStore((state) => state.sentFriendRequests);
  const receivedMessages = useSocialStore(
    (state) => state.receivedMessageRequests,
  );
  const sentMessages = useSocialStore((state) => state.sentMessageRequests);
  const socialLoading = useSocialStore(
    (state) =>
      state.loadingFriends ||
      state.loadingFriendRequests ||
      state.loadingMessageRequests,
  );
  const pendingActions = useSocialStore((state) => state.pendingActions);
  const error = useSocialStore((state) => state.error);
  const clearError = useSocialStore((state) => state.clearError);
  const loadFriends = useSocialStore((state) => state.loadFriends);
  const loadFriendRequests = useSocialStore(
    (state) => state.loadFriendRequests,
  );
  const loadMessageRequests = useSocialStore(
    (state) => state.loadMessageRequests,
  );
  const sendFriendRequest = useSocialStore((state) => state.sendFriendRequest);
  const acceptFriendRequest = useSocialStore(
    (state) => state.acceptFriendRequest,
  );
  const rejectFriendRequest = useSocialStore(
    (state) => state.rejectFriendRequest,
  );
  const cancelFriendRequest = useSocialStore(
    (state) => state.cancelFriendRequest,
  );
  const removeFriend = useSocialStore((state) => state.removeFriend);
  const acceptMessageRequest = useSocialStore(
    (state) => state.acceptMessageRequest,
  );
  const rejectMessageRequest = useSocialStore(
    (state) => state.rejectMessageRequest,
  );
  const addSentMessageRequest = useSocialStore(
    (state) => state.addSentMessageRequest,
  );
  const createDM = useChatStore((state) => state.createDM);
  const directoryUsers = useUsersStore((state) => state.directoryUsers);
  const loadingUsers = useUsersStore((state) => state.isLoading);
  const userSearchError = useUsersStore((state) => state.error);
  const clearUserSearchError = useUsersStore((state) => state.clearError);
  const fetchUsers = useUsersStore((state) => state.fetchUsers);
  const [query, setQuery] = useState("");
  const [peopleTab, setPeopleTab] = useState<PeopleTab>("friends");
  const [friendTab, setFriendTab] = useState<RequestTab>("received");
  const [messageTab, setMessageTab] = useState<RequestTab>("received");
  const [requestKind, setRequestKind] = useState<"friends" | "messages">(
    "friends",
  );
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (view === "people") {
      void loadFriends(true);
      void loadFriendRequests(true);
      void fetchUsers();
    } else {
      void loadFriendRequests(true);
      void loadMessageRequests(true);
    }
  }, [view, loadFriends, fetchUsers, loadFriendRequests, loadMessageRequests]);

  const people = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return directoryUsers
      .filter((person) => person.id !== userId)
      .filter(
        (person) =>
          !normalizedQuery ||
          person.name.toLocaleLowerCase().includes(normalizedQuery) ||
          person.email.toLocaleLowerCase().includes(normalizedQuery),
      );
  }, [directoryUsers, query, userId]);

  const visiblePeople = useMemo(() => {
    if (peopleTab === "friends") {
      return friends.filter((friend) => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return (
          !normalizedQuery ||
          friend.name.toLocaleLowerCase().includes(normalizedQuery) ||
          friend.email.toLocaleLowerCase().includes(normalizedQuery)
        );
      });
    }

    const friendIds = new Set(friends.map((friend) => friend.id));
    return people.filter((person) => !friendIds.has(person.id));
  }, [friends, people, peopleTab, query]);

  const openConversation = async (targetId: string) => {
    const conversation = await createDM(targetId);
    if (!conversation) return;
    addSentMessageRequest(conversation);
    openChat();
    router.push(`/chat/${conversation.id}`);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 2400);
  };

  const currentFriends =
    friendTab === "received" ? receivedFriends : sentFriends;
  const currentMessageRequests =
    messageTab === "received" ? receivedMessages : sentMessages;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4 md:px-5">
        <h3 className="text-lg font-semibold text-white">
          {view === "people" ? "Friends" : "Requests"}
        </h3>
        {view === "people" ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-[#080D18] p-1">
              {(
                [
                  { id: "friends", label: "Friends" },
                  { id: "allUsers", label: "All Users" },
                ] as const
              ).map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setPeopleTab(tab.id)}
                  aria-pressed={peopleTab === tab.id}
                  className={`rounded-md py-2 text-xs font-medium ${peopleTab === tab.id ? "bg-[#1B2740] text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${peopleTab === "friends" ? "friends" : "users"} by name or email`}
                className="h-10 w-full rounded-lg border border-[#222C43] bg-[#111827] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-[#080D18] p-1">
            {(["friends", "messages"] as const).map((kind) => (
              <button
                type="button"
                key={kind}
                onClick={() => setRequestKind(kind)}
                className={`rounded-md py-2 text-xs font-medium capitalize ${requestKind === kind ? "bg-[#1B2740] text-white" : "text-slate-400 hover:text-white"}`}
              >
                {kind === "friends" ? "Friend requests" : "Message requests"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-5">
        {(error || userSearchError) && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
            <span>{error ?? userSearchError}</span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  clearUserSearchError();
                  if (view === "people") {
                    void Promise.all([
                      fetchUsers(),
                      loadFriends(true),
                      loadFriendRequests(true),
                    ]);
                  } else {
                    void loadFriendRequests(true);
                    void loadMessageRequests(true);
                  }
                }}
                className="font-medium text-white"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  clearUserSearchError();
                }}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}
        {success && (
          <p
            role="status"
            className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
          >
            {success}
          </p>
        )}

        {view === "people" && (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {peopleTab === "friends" ? "My Friends" : "All Users"}
            </p>
            {(loadingUsers && directoryUsers.length === 0) ||
            (socialLoading &&
              peopleTab === "friends" &&
              friends.length === 0) ? (
              <LoadingState
                message={
                  peopleTab === "friends"
                    ? "Loading friends..."
                    : "Loading people..."
                }
              />
            ) : null}
            {!loadingUsers && !socialLoading && visiblePeople.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {query.trim()
                  ? `No ${peopleTab === "friends" ? "friends" : "users"} match your search`
                  : peopleTab === "friends"
                    ? "You have no friends yet"
                    : "No other registered users found"}
              </p>
            ) : null}
            {visiblePeople.map((person) => {
              const derivedStatus = friends.some(
                (friend) => friend.id === person.id,
              )
                ? "friends"
                : receivedFriends.some(
                      (request) => request.senderId === person.id,
                    )
                  ? "received"
                  : sentFriends.some(
                        (request) => request.recipientId === person.id,
                      )
                    ? "sent"
                    : "none";
              const status = derivedStatus;
              const requestReceived = receivedFriends.find(
                (request) => request.senderId === person.id,
              );
              const requestSent = sentFriends.find(
                (request) => request.recipientId === person.id,
              );
              const actionId =
                requestReceived?.id ?? requestSent?.id ?? person.id;
              const busy = Boolean(pendingActions[actionId]);

              return (
                <UserRow
                  key={person.id}
                  user={person}
                  onMessage={() => void openConversation(person.id)}
                  canMessage={status !== "received"}
                  trailing={
                    status === "friends" ? (
                      <div className="flex items-center gap-1">
                        <span className="rounded-md bg-emerald-500/10 px-2 py-2 text-[10px] font-medium text-emerald-300">
                          Friends
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${person.name} from your friends?`,
                              )
                            ) {
                              void removeFriend(person.id).then((removed) => {
                                if (removed) showSuccess("Friend removed");
                              });
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                          aria-label={`Remove ${person.name}`}
                          title="Remove friend"
                        >
                          <UserMinus size={15} />
                        </button>
                      </div>
                    ) : status === "received" && requestReceived ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (await acceptFriendRequest(requestReceived.id))
                              showSuccess("Friend request accepted");
                          }}
                          className="rounded-md bg-emerald-600 px-2 py-2 text-[10px] font-medium text-white disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (await rejectFriendRequest(requestReceived.id))
                              showSuccess("Friend request rejected");
                          }}
                          className="rounded-md bg-[#1B2740] px-2 py-2 text-[10px] font-medium text-slate-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : status === "sent" ? (
                      <span className="rounded-md bg-[#1B2740] px-2 py-2 text-[10px] font-medium text-indigo-200">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || socialLoading}
                        onClick={async () => {
                          if (await sendFriendRequest(person.id))
                            showSuccess("Friend request sent");
                        }}
                        className="flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        aria-label={`Add ${person.name} as a friend`}
                      >
                        <UserPlus size={14} /> Add Friend
                      </button>
                    )
                  }
                />
              );
            })}
          </>
        )}

        {view === "requests" && requestKind === "friends" && (
          <>
            <div className="mb-3 flex gap-2 border-b border-[#1B2233]">
              {(["received", "sent"] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setFriendTab(tab)}
                  className={`border-b-2 px-2 pb-2 text-xs font-medium capitalize ${friendTab === tab ? "border-indigo-500 text-white" : "border-transparent text-slate-400"}`}
                >
                  {tab}{" "}
                  {tab === "received" && receivedFriends.length > 0
                    ? `(${receivedFriends.length})`
                    : ""}
                </button>
              ))}
            </div>
            {socialLoading && currentFriends.length === 0 ? (
              <LoadingState message="Loading friend requests..." />
            ) : null}
            {!socialLoading && currentFriends.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No {friendTab} friend requests
              </p>
            ) : null}
            {currentFriends.map((request) => {
              const person =
                friendTab === "received" ? request.sender : request.recipient;
              if (!person) return null;
              const busy = pendingActions[request.id];
              return (
                <div
                  key={request.id}
                  className="flex items-center gap-3 border-b border-[#1B2233] py-3"
                >
                  <PersonAvatar
                    user={person}
                    online={person.status === "online"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {person.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={12} />
                      {request.createdAt
                        ? formatConversationTime(request.createdAt)
                        : "Pending"}
                    </p>
                  </div>
                  {friendTab === "received" ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (await acceptFriendRequest(request.id))
                            showSuccess("Friend request accepted");
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                        aria-label={`Accept ${person.name}`}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (await rejectFriendRequest(request.id))
                            showSuccess("Friend request declined");
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B2233] text-slate-300 disabled:opacity-50"
                        aria-label={`Reject ${person.name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        if (await cancelFriendRequest(request.id))
                          showSuccess("Friend request cancelled");
                      }}
                      className="rounded-lg border border-[#29344E] px-2.5 py-2 text-xs text-slate-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {view === "requests" && requestKind === "messages" && (
          <>
            <div className="mb-3 flex gap-2 border-b border-[#1B2233]">
              {(["received", "sent"] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setMessageTab(tab)}
                  className={`border-b-2 px-2 pb-2 text-xs font-medium capitalize ${messageTab === tab ? "border-indigo-500 text-white" : "border-transparent text-slate-400"}`}
                >
                  {tab}{" "}
                  {tab === "received" && receivedMessages.length > 0
                    ? `(${receivedMessages.length})`
                    : ""}
                </button>
              ))}
            </div>
            {socialLoading && currentMessageRequests.length === 0 ? (
              <LoadingState message="Loading message requests..." />
            ) : null}
            {!socialLoading && currentMessageRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No {messageTab} message requests
              </p>
            ) : null}
            {currentMessageRequests.map((request) => {
              const conversation = request.conversation;
              const busy = pendingActions[request.id];
              const participant: User = {
                id:
                  conversation.participantIds.find((id) => id !== userId) ?? "",
                name: conversation.name,
                email: "",
                avatar: conversation.avatar,
                status: conversation.isOnline ? "online" : "offline",
              };
              return (
                <div
                  key={request.id}
                  className="border-b border-[#1B2233] py-3"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      user={participant}
                      online={participant.status === "online"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {conversation.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {conversation.lastMessage || "New message request"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {formatConversationTime(
                        request.createdAt || conversation.lastMessageAt,
                      )}
                    </span>
                  </div>
                  {messageTab === "received" ? (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (await rejectMessageRequest(request.id))
                            showSuccess("Message request declined");
                        }}
                        className="rounded-lg border border-[#29344E] px-3 py-2 text-xs text-slate-300 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          if (await acceptMessageRequest(request.id))
                            showSuccess("Message request accepted");
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        openChat();
                        router.push(`/chat/${conversation.id}`);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#29344E] py-2 text-xs text-slate-200 hover:bg-[#151D31]"
                    >
                      <MessageCircle size={14} />
                      Open conversation
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
