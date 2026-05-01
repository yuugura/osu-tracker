"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTO_IMPORT_STORAGE_KEY = "osu-tracker:last-auto-import";
const AUTO_IMPORT_INTERVAL_MS = 1000 * 60 * 15;

export function AutoImportRecentPlays() {
  const router = useRouter();

  useEffect(() => {
    const lastImport = Number(
      window.localStorage.getItem(AUTO_IMPORT_STORAGE_KEY) ?? "0",
    );

    if (Date.now() - lastImport < AUTO_IMPORT_INTERVAL_MS) {
      return;
    }

    const controller = new AbortController();

    async function importRecentPlays() {
      try {
        const response = await fetch("/api/sessions/import-recent", {
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        window.localStorage.setItem(
          AUTO_IMPORT_STORAGE_KEY,
          String(Date.now()),
        );
        router.refresh();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Auto import failed", error);
      }
    }

    void importRecentPlays();

    return () => {
      controller.abort();
    };
  }, [router]);

  return null;
}
