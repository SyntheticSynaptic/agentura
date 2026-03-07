"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CheckoutButtonProps {
  priceId: string;
  label: string;
  className?: string;
}

export function CheckoutButton({ priceId, label, className }: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        if (payload.error === "unauthorized") {
          router.push("/login?redirect=/pricing");
          return;
        }

        throw new Error(payload.error ?? "Unable to start checkout");
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("Missing checkout url");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      window.alert(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleCheckout}
      className={className}
    >
      {isLoading ? "Redirecting..." : label}
    </button>
  );
}
