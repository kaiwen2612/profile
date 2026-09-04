import type { Achievement } from "@/lib/schemas";

export function Timeline({ items }: { items: Achievement[] }) {
  return (
    <ol className="space-y-6 border-l border-neutral-300 pl-6 dark:border-neutral-700">
      {items.map((item) => (
        <li key={`${item.date}-${item.title}`} className="relative">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.date}</p>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="mt-1 text-neutral-700 dark:text-neutral-300">{item.detail}</p>
          {item.evidenceUrl && (
            <a
              href={item.evidenceUrl}
              className="mt-1 inline-block text-sm underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Evidence
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}
