import Image from "next/image";
import { Phone, Video, Search, MoreVertical } from "lucide-react";

export default function ChatHeader() {
  return (
    <header className="flex h-[86px] 2xl:h-24 items-center justify-between border-b border-[#222C43] bg-[#111827] px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Image
            src="https://i.pravatar.cc/150?img=11"
            alt="John"
            width={56}
            height={56}
            className="rounded-full h-12 w-12 2xl:h-14 2xl:w-14"
          />

          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0F172A] bg-green-500" />
        </div>

        <div>
          <h2 className="text-lg 2xl:text-xl font-semibold text-white">
            John Doe
          </h2>

          <p className="text-xs 2xl:text-sm text-green-400">Online</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {[
          <Phone key="phone" size={20} />,
          <Video key="video" size={20} />,
          <Search key="search" size={20} />,
          <MoreVertical key="more" size={20} />,
        ].map((icon, index) => (
          <button
            key={index}
            className="flex h-10 w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl border border-[#222C43] bg-[#111827] text-slate-300 transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
          >
            {icon}
          </button>
        ))}
      </div>
    </header>
  );
}
