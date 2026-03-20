import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import {
  ArrowRight,
  AlertTriangle,
  Scale,
  Clock,
  TrendingUp,
  Calendar,
  BookOpen,
  ListChecks,
  ShieldCheck,
  Eye,
  ServerOff,
  Lock,
} from "lucide-react";

export default function ParentsPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-[700px] h-[500px] rounded-full bg-chart-3/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-[500px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent max-w-3xl mx-auto leading-[1.1]">
            Your kid&apos;s grades shouldn&apos;t be a mystery
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jebbix connects to your school&apos;s grading system and shows you exactly which assignments matter most &mdash; before it&apos;s too late to do anything about it.
          </p>

          <div className="mt-10">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px shadow-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              Sound familiar?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-5 w-5 text-chart-4" />
              </div>
              <p className="text-[14px] font-medium text-foreground leading-relaxed">
                &ldquo;Report cards shouldn&apos;t be the first time you find out something&apos;s wrong.&rdquo;
              </p>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Jebbix shows engagement patterns in real time &mdash; so you see the drift before the damage.
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <Scale className="h-5 w-5 text-chart-3" />
              </div>
              <p className="text-[14px] font-medium text-foreground leading-relaxed">
                &ldquo;Not all assignments are created equal &mdash; some barely matter, some make or break a grade.&rdquo;
              </p>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Jebbix ranks every assignment by grade impact. The ones that move the needle are always on top.
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[14px] font-medium text-foreground leading-relaxed">
                &ldquo;Your student is busy, not lazy. They just need to know where to focus.&rdquo;
              </p>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Instead of a wall of assignments, Jebbix shows tonight&apos;s priorities &mdash; what to work on first, and why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Parents Get */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            What you get as a parent
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
            One dashboard for all your kids. No more juggling logins.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Tonight&apos;s Priorities
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              See which assignments matter most right now, ranked by how much they can move each class grade.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Engagement Tracking
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Are they turning things in on time, or starting to slip? Submission timing patterns tell the real story.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <Calendar className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Coming Up
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              A 7-day calendar of what&apos;s due across every class. No surprises, no missed deadlines.
            </p>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              For students: stop guessing, start with what matters
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
              Start with the assignment that moves your grade the most. Every time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <BookOpen className="h-5 w-5 text-chart-3" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">Study Plan</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Plan your study session around grade impact. Know exactly what to work on and for how long.
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">All Assignments</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Every assignment across every class, sorted by what matters. Filter, search, and focus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            Your family&apos;s data stays private
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Browser-Only</h3>
            <p className="text-[12px] text-muted-foreground">Grades stay in your browser. Nothing on our servers.</p>
          </div>
          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Read-Only</h3>
            <p className="text-[12px] text-muted-foreground">We never change anything in your school&apos;s system. View only.</p>
          </div>
          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
              <ServerOff className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">No Passwords</h3>
            <p className="text-[12px] text-muted-foreground">OAuth2 means your password goes to your school, not us.</p>
          </div>
          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">No Sharing</h3>
            <p className="text-[12px] text-muted-foreground">Your data is never sold or shared. Period.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t bg-secondary/30 dark:bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-[20px] font-bold text-foreground mb-3">
            See what your student is up against &mdash; tonight
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8">
            Connect your parent account and get clarity in under a minute.
          </p>
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px shadow-sm"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[11px]">J</span>
            </div>
            <span className="text-[13px] font-medium text-foreground">Jebbix</span>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">For Schools</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
            <Link href="/connect" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            &copy; 2026 Jebbix
          </p>
        </div>
      </footer>
    </div>
  );
}
