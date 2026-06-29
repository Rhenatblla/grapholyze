"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", href: "/admin" },
  { name: "Data User", href: "/admin/data-user" },
  { name: "Statistik Data", href: "/admin/statistik-data" },
  { name: "Export Data", href: "/admin/export-data" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#2c3e50] text-white min-h-screen fixed top-0 left-0">
      <div className="p-8 border-b border-gray-700">
        <h2 className="text-3xl font-bold">Admin</h2>
      </div>
      <nav className="mt-6">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className={`block px-8 py-4 text-lg transition-all ${pathname === item.href ? "bg-white text-[#2c3e50] font-bold" : "hover:bg-[#34495e]"}`}>
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
