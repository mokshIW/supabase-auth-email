"use client";

import { useEffect, useState } from "react";

export default function ClientComponent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      setUser(null);
    }
    getUser();
  }, []);

  return <h2>{user?.email}</h2>;
}
