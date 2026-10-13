import { auth } from "@clerk/nextjs/server";

import { DashboardSidebar } from "@/components/DashboardSidebar";

/** Marco del panel y la cuenta: sidebar + contenido. Protegido por recurso
 * (las páginas son client components y no pueden llamar a `auth.protect()`;
 * los datos siguen exigiendo sesión en cada query/mutation de Convex). */
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
