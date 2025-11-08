import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/auth.server";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Dashboard</h1>
        <p className="mt-4 text-muted-foreground">
          Welcome back, {user.email}!
        </p>
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            This is a protected page. You can only see this if you are signed in.
          </p>
        </div>
      </div>
    </div>
  );
}
