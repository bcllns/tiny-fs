'use client';


import { PanelTopClose } from "lucide-react";


import { Button } from "@/components/ui/button";


export const MyAccountButton = () => {
  return (
    <Button variant="ghost" size="sm">
        <PanelTopClose className="h-4 w-4" />
    </Button>
  );
};
