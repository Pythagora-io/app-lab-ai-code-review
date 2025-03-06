import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Settings, PanelLeft } from "lucide-react";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const items = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div
      className={cn(
        "relative border-r bg-background/60 backdrop-blur-[8px] h-[calc(100vh-4rem)]",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      <div className="flex h-[52px] items-center justify-end border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <PanelLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem-52px)]">
        <div className="p-2">
          {items.map(({ icon: Icon, label, path }) => (
            <Link key={path} to={path}>
              <Button
                variant={location.pathname === path ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-4",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && label}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}