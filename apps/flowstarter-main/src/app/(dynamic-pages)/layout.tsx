export const metadata = {
  title: 'Flowstarter',
  description: 'Flowstarter',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
