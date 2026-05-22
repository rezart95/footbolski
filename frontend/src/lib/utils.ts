export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function colorFromName(name: string) {
  const colors = ["bg-emerald-500", "bg-lime-500", "bg-cyan-500", "bg-sky-500", "bg-amber-500"];
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}
