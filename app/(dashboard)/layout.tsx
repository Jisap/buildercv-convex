import { DashboardSidebar } from "@/components/DashboardSidebar";

/** Marco del panel y la cuenta: sidebar + contenido. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
