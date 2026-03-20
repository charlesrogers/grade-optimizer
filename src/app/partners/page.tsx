import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import {
  ArrowRight,
  Heart,
  TrendingUp,
  Users,
  ShieldCheck,
  Eye,
  Sparkles,
  GraduationCap,
  HandHeart,
  Target,
  School,
  BarChart3,
  Home,
} from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-chart-2/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-[13px] font-medium mb-6">
            <Heart className="h-3.5 w-3.5" />
            LMS Integration Partner
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1]">
            Your LMS already has the data. We help students use it.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every modern LMS has assignment weights, due dates, and submission history sitting right there. Jebbix turns that into one simple answer for every student: <em>what should I work on tonight?</em>
          </p>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-[20px] font-bold text-foreground text-center mb-10">
            The problem we keep hearing
          </h2>

          <div className="space-y-6 text-[15px] text-muted-foreground leading-relaxed">
            <p>
              Students open their LMS and see a wall of assignments. Some are worth 5% of their grade. Some are worth 30%. But they all look the same. So students either do whatever&apos;s due next, or get overwhelmed and do nothing.
            </p>
            <p>
              Parents log in and see grades &mdash; but by the time a grade drops, the window to do something about it has already closed. There&apos;s no early warning. No signal that says <em>&ldquo;hey, this one matters &mdash; don&apos;t let it slip.&rdquo;</em>
            </p>
            <p className="text-foreground font-medium">
              The data to solve this already lives in the LMS. Nobody&apos;s connecting it for families.
            </p>
          </div>
        </div>
      </section>

      {/* What Jebbix Does */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            What Jebbix gives families
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
            We take what the LMS already knows and make it actionable at home.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              &ldquo;Work on this first&rdquo;
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Every assignment ranked by how much it can move the final grade. Category weights, point values, current scores &mdash; all factored in. Students always know what matters most right now.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              &ldquo;They&apos;re starting to slip&rdquo;
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Submission timing patterns reveal disengagement before grades drop. A student who starts turning things in later and later is drifting &mdash; and we surface that signal early, while there&apos;s still time to act.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-chart-2" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              &ldquo;All my kids, one place&rdquo;
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Parent observer accounts work natively. One login, every child&apos;s priorities in a single dashboard. No switching accounts, no separate apps.
            </p>
          </div>
        </div>
      </section>

      {/* Where Jebbix lives */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              Where Jebbix fits
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground max-w-xl mx-auto">
              The LMS gives institutions the tools to teach, assess, and manage. Jebbix picks up where the school day ends.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                <School className="h-5 w-5 text-chart-2" />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground mb-2">The LMS handles the classroom</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Course delivery, grading, rubrics, discussions, announcements &mdash; everything teachers and admins need to run instruction. That&apos;s the platform&apos;s job.
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground mb-2">Analytics tools handle the institution</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                District-wide analytics, course effectiveness, standards alignment, admin dashboards &mdash; the bird&apos;s-eye view that helps leadership make decisions. That&apos;s institutional intelligence.
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 ring-2 ring-primary/20">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground mb-2">Jebbix handles the kitchen table</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                It&apos;s 8pm, homework is due, and a student needs to know what to work on first. A parent wants to know if their kid is keeping up. That&apos;s the moment Jebbix serves &mdash; and it&apos;s a moment no one else is in.
              </p>
            </div>
          </div>

          <div className="mt-10 max-w-2xl mx-auto text-center">
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Jebbix doesn&apos;t touch course management, grading, content delivery, assessments, or institutional analytics. We don&apos;t build tools for teachers or admins. We serve one audience &mdash; families &mdash; in one moment: the nightly decision of what to work on and whether to worry.
            </p>
          </div>
        </div>
      </section>

      {/* Why Partnerships */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-[20px] font-bold text-foreground">
            Why LMS partnerships matter to us
          </h2>
        </div>

        <div className="space-y-6 text-[15px] text-muted-foreground leading-relaxed">
          <p>
            Jebbix only works if the underlying platform has great data. Assignment groups with weights, submission timestamps with late metadata, observer relationships with linked students &mdash; we need all of it, well-structured and accessible. The better the LMS API, the more value we can deliver to families.
          </p>
          <p>
            That&apos;s why we want to partner with the platforms that got the hard part right. We&apos;re just the last mile &mdash; turning structured data into a clear answer for families at home.
          </p>
          <p>
            When a parent&apos;s experience improves because their kid focused on the right assignment &mdash; that&apos;s a win for everyone. The family is happier. The student performs better. And the LMS is the platform that made it possible.
          </p>
        </div>
      </section>

      {/* What We Believe In */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            How we think about student data
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Read-only. Always.</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Jebbix only requests read-only API scopes. We can never modify a grade, change an assignment, or submit on a student&apos;s behalf. We view. That&apos;s it.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Browser-local by design</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Grade data lives in the student&apos;s browser. We don&apos;t store grades, names, or assignments on our servers. When a student disconnects, their data is gone.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <HandHeart className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Families only</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We don&apos;t sell to districts. We don&apos;t build teacher tools. We don&apos;t do institutional analytics. Jebbix is a family utility &mdash; students and parents, that&apos;s it.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Better platform, better Jebbix</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Every API improvement makes Jebbix more useful. We&apos;re aligned with our LMS partners: the better the data infrastructure, the more value we surface for students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Ask */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-[20px] font-bold text-foreground mb-4">
            We&apos;re looking for the right LMS partner
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mx-auto mb-4">
            Jebbix is built and ready to integrate. We&apos;re looking for an LMS partner with a strong API, a commitment to open data, and a belief that families deserve better tools at home.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
            We&apos;re a small team that cares deeply about building useful things for students and parents. The right partnership means families get clarity &mdash; and the platform gets more engaged, happier users.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-[20px] font-bold text-foreground mb-3">
            Let&apos;s talk
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-lg mx-auto">
            We&apos;d love to show you what Jebbix does and talk about how we can work together to help families.
          </p>
          <a
            href="mailto:hello@jebbix.com"
            className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px shadow-sm"
          >
            hello@jebbix.com
            <ArrowRight className="h-4 w-4" />
          </a>
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
            <Link href="/parents" className="hover:text-foreground transition-colors">For Parents</Link>
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
