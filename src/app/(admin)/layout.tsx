import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

/** Admin chrome — everything the host sees. Public pages (/book) have their
 * own minimal layout. */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="paper-grain flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
