import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("scooter_admin_token")?.value;

  redirect(token ? "/dashboard" : "/login");
}
