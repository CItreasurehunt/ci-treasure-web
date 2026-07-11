import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeachersPage() {
  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-(--color-sand-strong) bg-white/80">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to calendar
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <h1 className="font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl">
            Teachers
          </h1>
          <p className="text-lg text-slate-600">
            The teacher directory is coming soon. In the meantime, teacher profiles are linked from individual event pages.
          </p>
        </div>
      </div>
    </main>
  );
}
