import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RiskyApp } from "@/components/RiskyApp";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <RiskyApp userId={user.id} />;
}
