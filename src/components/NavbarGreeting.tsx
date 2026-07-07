"use client";

import { useEffect, useState } from "react";

export default function NavbarGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Hola");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting("Buenos días");
    } else if (hour >= 12 && hour < 19) {
      setGreeting("Buenas tardes");
    } else {
      setGreeting("Buenas noches");
    }
  }, []);

  return (
    <span className="text-xs leading-none font-bold text-[#2E4068]">
      {greeting}, {name}
    </span>
  );
}
