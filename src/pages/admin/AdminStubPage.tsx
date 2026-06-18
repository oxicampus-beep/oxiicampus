import type { LucideIcon } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";

export default function AdminStubPage({
  title,
  description,
  icon: Icon,
  features,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />
      <AdminCard>
        <div className="flex flex-col items-center text-center py-10 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 grid place-items-center">
            <Icon className="h-8 w-8 text-amber-400" />
          </div>
          <Badge variant="outline" className="border-amber-400/30 text-amber-400">SwiftData Admin Module</Badge>
          <p className="text-white/50 text-sm max-w-md">
            This module mirrors the SwiftData Ghana admin panel. Core platform data is wired;
            advanced automation features will connect as backend services are added.
          </p>
          {features && features.length > 0 && (
            <ul className="text-left text-sm text-white/60 space-y-2 mt-4 w-full max-w-md">
              {features.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
