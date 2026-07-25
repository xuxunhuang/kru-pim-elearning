import { requireUser } from "@/lib/auth";import { assertAdmin } from "@/lib/data";import { AdminConsole } from "./AdminConsole";
export const dynamic="force-dynamic";export const metadata={title:"หลังบ้าน Admin"};
export default async function Page(){const u=await requireUser();assertAdmin(u);return <AdminConsole name={u.displayName}/>}
