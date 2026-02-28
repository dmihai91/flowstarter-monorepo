export default function EditorProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-height layout for the editor — no footer, no sidebar
  return <div className="h-full w-full">{children}</div>;
}
