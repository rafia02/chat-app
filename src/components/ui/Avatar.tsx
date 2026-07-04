interface Props {
  name: string;
}

export default function Avatar({ name }: Props) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
