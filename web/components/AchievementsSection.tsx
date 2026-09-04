import type { Achievement } from "@/lib/schemas";
import { Timeline } from "@/components/Timeline";

export function AchievementsSection({ items }: { items: Achievement[] }) {
  return <Timeline items={items} />;
}
