import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
