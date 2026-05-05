import { redirect } from "next/navigation";

export default function FastFoodPage() {
  redirect("/online-store?section=FAST_FOOD");
}