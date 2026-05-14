export const metadata = {
  title: {
    default: 'Flowstarter | Done-for-you websites for coaches',
    template: '%s | Flowstarter',
  },
  description:
    'We build your website and set up online booking for coaches, therapists, clinics, and service businesses. Get found. Get booked. No tech skills needed.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
