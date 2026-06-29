import Sidebar from "@/components/admin/Sidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 min-h-screen bg-gray-50 w-full relative">
        <AdminNavbar />
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}
