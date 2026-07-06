"use client";

import { MessageCircle, Users, Bell, Bookmark, CircleHelp } from "lucide-react";

const menus = [Users, Bookmark, Bell];

export default function LeftRail() {
  return (
    <div className="flex flex-col items-center justify-between border-r border-[#1B2233] bg-[#0A0F1C] py-6 px-2 2xl:px-4">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
          <MessageCircle className="text-white" />
        </div>

        {menus.map((Icon, index) => (
          <button
            key={index}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#151D31] hover:text-white"
          >
            <Icon size={22} />
          </button>
        ))}
      </div>

      <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#151D31] hover:text-white">
        <CircleHelp size={22} />
      </button>
    </div>
  );
}
