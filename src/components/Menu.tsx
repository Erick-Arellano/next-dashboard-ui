import { getSession } from "@/lib/session";
import MenuClient from "./MenuClient";

const Menu = async () => {
  const { role } = await getSession();
  return <MenuClient role={role} />;
};

export default Menu;
