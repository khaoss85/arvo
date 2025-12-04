import { requireGymOwner } from "@/lib/utils/auth.server";

export default async function GymAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only check role here - gym ownership is checked in nested layouts
  await requireGymOwner();

  return <>{children}</>;
}
