import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import {
  BarChart3,
  Activity,
  Users,
  ArrowRight,
  Link2,
  ListChecks,
  Zap,
  ShieldCheck,
  Eye,
  ServerOff,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-2/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-[13px] font-medium mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Works with your school&apos;s LMS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent max-w-3xl mx-auto leading-[1.1]">
            Help your students focus on what actually moves their grade
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jebbix connects to your school&apos;s learning management system and shows students a prioritized to-do list &mdash; assignments ranked by how much they impact the final grade. Less guessing, more progress.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px shadow-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            Everything students and parents need to stay ahead
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
            Jebbix turns your LMS data into clear priorities so nobody has to guess what matters most.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Grade Impact Ranking
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Every assignment ranked by how much it can move the needle. Students always know what matters most tonight.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Early Warning Signals
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Submission timing patterns reveal disengagement before grades drop. Spot the drift, not the damage.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Family Dashboard
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Parents see all their children in one view. Per-student drill-down with no separate logins needed.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              Up and running in under a minute
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Three steps. No installation. No IT ticket required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">
                Step 1
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">
                Connect Your LMS
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Sign in with your school&apos;s learning platform. OAuth2 keeps your password private &mdash; Jebbix never sees it.
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-4">
                <ListChecks className="h-5 w-5 text-chart-2" />
              </div>
              <div className="text-[11px] font-semibold text-chart-2 uppercase tracking-wider mb-2">
                Step 2
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">
                See Priorities
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Assignments appear ranked by grade impact and color-coded by urgency. The biggest needle-movers are always on top.
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-5 w-5 text-chart-3" />
              </div>
              <div className="text-[11px] font-semibold text-chart-3 uppercase tracking-wider mb-2">
                Step 3
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">
                Take Action
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Students know what to work on tonight. Parents see early warning signals before small slips become big problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            Privacy-first by design
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
            Jebbix was built so your data never has to leave your browser.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Browser-Only Storage</h3>
            <p className="text-[12px] text-muted-foreground">Your grades and assignments stay in your browser. Nothing is saved on our servers.</p>
          </div>

          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Read-Only Access</h3>
            <p className="text-[12px] text-muted-foreground">We never modify grades, assignments, or any data in your LMS. View only.</p>
          </div>

          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
              <ServerOff className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">No Credential Storage</h3>
            <p className="text-[12px] text-muted-foreground">Your password is never sent to us. OAuth2 handles authentication directly with your school.</p>
          </div>

          <div className="flex flex-col items-center text-center p-5">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">No Third-Party Sharing</h3>
            <p className="text-[12px] text-muted-foreground">Your data is never sold, shared, or sent to any third party. Period.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t bg-secondary/30 dark:bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-[20px] font-bold text-foreground mb-3">
            Ready to help your students prioritize?
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8">
            Connect your school account and see what matters most &mdash; in under a minute.
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
            <Link href="/parents" className="hover:text-foreground transition-colors">For Parents</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
            <Link href="/connect" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            &copy; 2026 Jebbix &middot; Built by{" "}
            <a href="https://imprevista.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Imprevista
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
