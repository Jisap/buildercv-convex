import { auth } from "@clerk/nextjs/server";

import { EditorShell } from "@/features/editor/EditorShell";

// Ruta dinámica por naturaleza (sesión + datos del CV): sin shell estático.
export const instant = false;

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();
  const { id } = await params;
  return <EditorShell resumeId={id} />;
}
