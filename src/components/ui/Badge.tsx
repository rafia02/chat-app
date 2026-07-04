interface Props {
  text: string;
}

export default function Badge({ text }: Props) {
  return (
    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
      {text}
    </span>
  );
}
