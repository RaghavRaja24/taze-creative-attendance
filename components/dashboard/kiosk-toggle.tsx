"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

import { Button } from "@/components/ui/button";

export function KioskToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const kioskRoot = document.querySelector("[data-kiosk-root]") as HTMLElement | null;
    if (!kioskRoot) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await kioskRoot.requestFullscreen();
  };

  return (
    <Button onClick={toggleFullscreen} type="button" variant="outline">
      {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
      {isFullscreen ? "Exit Kiosk" : "Kiosk Mode"}
    </Button>
  );
}
