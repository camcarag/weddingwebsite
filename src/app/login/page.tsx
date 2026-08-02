import { Bricolage_Grotesque } from "next/font/google";
import { login } from "./actions";

const heading = Bricolage_Grotesque({ subsets: ["latin"], weight: "800" });

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6efe1] p-6">
      <form
        action={login}
        className="w-full max-w-sm rounded-3xl border border-neutral-900/10 bg-white p-8 text-center shadow-lg"
      >
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-neutral-500">Save the Date</p>
        <h1 className={`${heading.className} mb-6 text-2xl tracking-tight`} style={{ color: "#204C32" }}>
          Cam &amp; Jon
        </h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="w-full rounded-full border border-neutral-900/15 px-4 py-2.5 text-center text-sm text-neutral-900 outline-none focus:border-[#204C32]"
        />
        {error && <p className="mt-3 text-sm text-red-600">That&apos;s not it — try again.</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-[#204C32] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#183a26]"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
