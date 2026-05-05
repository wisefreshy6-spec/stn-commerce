import { redirect } from "next/navigation";

export default function ExclusiveStorePage() {
  redirect("/online-store?section=EXCLUSIVE_STORE");
}