import AuthGuard from "@/components/auth/AuthGuard";

export default function ChatRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
