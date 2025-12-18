"use client";

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/one01");
  }, [router]);
  
  return null;
}
