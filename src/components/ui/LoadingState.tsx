import { Spinner } from "./Spinner";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <Spinner size="lg" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
