import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedDemoLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
