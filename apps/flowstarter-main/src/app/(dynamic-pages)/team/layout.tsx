export const metadata = {
  title: {
    default: 'Dashboard | Flowstarter',
    template: '%s | Flowstarter Dashboard',
  },
  description: 'Manage your websites, track projects, and collaborate with your team.',
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
