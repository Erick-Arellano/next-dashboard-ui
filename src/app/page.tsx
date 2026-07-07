import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const Homepage = async () => {
  const { role } = await getSession();

  if (role === "guest") {
    redirect("/sign-in");
  } else if (role === "admin") {
    redirect("/admin");
  } else if (role === "teacher") {
    redirect("/teacher");
  } else if (role === "student") {
    redirect("/student");
  } else if (role === "parent") {
    redirect("/parent");
  } else {
    redirect("/sign-in");
  }
};

export default Homepage;