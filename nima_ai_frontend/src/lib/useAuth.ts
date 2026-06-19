"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/", "/login"];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("nima_token");
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!token && !isPublic) {
      router.replace("/login");
    } else if (token && pathname === "/login") {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  return ready;
}
