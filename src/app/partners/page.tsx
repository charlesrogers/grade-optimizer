import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  AlertCircle,
  ShieldCheck,
  Key,
  RefreshCw,
  ServerOff,
  Globe,
  Eye,
} from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-1/3 w-[600px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-[13px] font-medium mb-6">
            Canvas REST API v1
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent max-w-3xl mx-auto leading-[1.1]">
            Canvas LMS Integration
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jebbix uses the Canvas REST API to help students prioritize assignments by grade impact. Read-only. Browser-local. Privacy-first.
          </p>

          <div className="mt-10">
            <a
              href="mailto:hello@jebbix.com"
              className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:translate-y-px shadow-sm"
            >
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              How the integration works
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
              All data flows through the student&apos;s browser. Jebbix never stores PII on its servers.
            </p>
          </div>

          {/* Architecture diagram */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
                <div className="flex-1">
                  <div className="h-14 w-14 rounded-xl bg-chart-3/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-chart-3" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">Student Browser</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Data stays here</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="hidden sm:block w-16 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium">HTTPS</span>
                  <div className="hidden sm:block w-16 h-px bg-border" />
                </div>

                <div className="flex-1">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-[11px]">J</span>
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">Jebbix App</p>
                  <p className="text-[11px] text-muted-foreground mt-1">OAuth + API proxy</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="hidden sm:block w-16 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium">REST API</span>
                  <div className="hidden sm:block w-16 h-px bg-border" />
                </div>

                <div className="flex-1">
                  <div className="h-14 w-14 rounded-xl bg-chart-4/10 flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-6 w-6 text-chart-4" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">Canvas LMS</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Source of truth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Access */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-[20px] font-bold text-foreground">
            API scopes &mdash; read-only
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-lg mx-auto">
            Jebbix requests the minimum scopes needed. We never write to Canvas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Courses &amp; Enrollments</h3>
            <p className="text-[12px] text-muted-foreground">Active and completed courses with enrollment scores and term info.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">GET /api/v1/courses</code>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center mb-3">
              <ClipboardList className="h-4 w-4 text-chart-2" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Assignment Groups</h3>
            <p className="text-[12px] text-muted-foreground">Groups with weights, rules, and individual assignment details.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">GET /api/v1/courses/:id/assignment_groups</code>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3">
              <FileText className="h-4 w-4 text-chart-3" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Submissions</h3>
            <p className="text-[12px] text-muted-foreground">Scores, submission timestamps, late/missing status for engagement analysis.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">include[]=submission</code>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-chart-4/10 flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-chart-4" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Observer Relationships</h3>
            <p className="text-[12px] text-muted-foreground">Parent/observer accounts with linked student profiles for family dashboards.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">GET /api/v1/users/self/observees</code>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-chart-5/10 flex items-center justify-center mb-3">
              <AlertCircle className="h-4 w-4 text-chart-5" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Missing Submissions</h3>
            <p className="text-[12px] text-muted-foreground">Cross-course missing assignment detection for priority flagging.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">GET /api/v1/users/:id/missing_submissions</code>
          </div>

          <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">User Profile</h3>
            <p className="text-[12px] text-muted-foreground">Basic user identity for session validation and account type detection.</p>
            <code className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">GET /api/v1/users/self</code>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="bg-secondary/50 dark:bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-[20px] font-bold text-foreground">
              Privacy &amp; security model
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-chart-2" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">OAuth2 Standard Flow</h3>
                <p className="text-[12px] text-muted-foreground">Standard Canvas OAuth2 with CSRF protection. User passwords never touch Jebbix servers.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Secure Token Storage</h3>
                <p className="text-[12px] text-muted-foreground">Access tokens stored in httpOnly secure cookies. Never exposed to client-side JavaScript.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Auto Token Refresh</h3>
                <p className="text-[12px] text-muted-foreground">Tokens refresh automatically 5 minutes before expiry. No re-authentication needed.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <ServerOff className="h-4 w-4 text-chart-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">No Server-Side PII</h3>
                <p className="text-[12px] text-muted-foreground">Grade data is processed in the browser and stored in localStorage. Our servers see API responses in transit only.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-chart-5" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Multi-Tenant</h3>
                <p className="text-[12px] text-muted-foreground">Works with any Canvas instance. Students enter their school&apos;s Canvas URL &mdash; no pre-configuration needed.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-chart-2" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Read-Only Scopes</h3>
                <p className="text-[12px] text-muted-foreground">Minimal OAuth2 scopes. No write access requested. Jebbix cannot modify any Canvas data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-[20px] font-bold text-foreground mb-3">
            Interested in working with Jebbix?
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-lg mx-auto">
            We&apos;d love to talk about integration, partnerships, or how Jebbix can work with your LMS platform.
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
