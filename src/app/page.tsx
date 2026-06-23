import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RiskyApp } from "@/components/RiskyApp";

export default async function Home() {
  // Until Supabase keys are configured, show the visual preview.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/preview");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <RiskyApp userId={user.id} />;
}
