import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Upload, Sparkles, MessageCircle, BarChart3, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary/10">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-primary">CreditSetu AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button className="hidden md:inline-flex rounded-full bg-primary px-6 font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
              Check My Readiness Free
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary w-fit">
                  <Sparkles className="mr-2 h-3.5 w-3.5 fill-primary/20" />
                  Hackathon 2024 Finalist
                </div>
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl xl:text-6xl/none">
                    Stop getting rejected. <br />
                    <span className="text-primary">Get Loan Ready.</span>
                  </h1>
                  <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                    60% of MSME loans fail due to bad paperwork. Our AI auditor pre-checks your documents and builds your path to approval in minutes, not weeks.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-xl shadow-primary/20 group">
                    Start Your Free Audit
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 rounded-full px-8 text-base border-primary/20 text-primary hover:bg-primary/5">
                    View Sample Report
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p>Trusted by 200+ MSMEs to secure capital.</p>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <div className="relative aspect-square w-full sm:aspect-[4/3] lg:aspect-square">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/10 to-transparent blur-2xl" />
                  <Image
                    src="/images/hero.png"
                    alt="Loan Health Score Dashboard"
                    fill
                    className="object-contain drop-shadow-2xl transition-all duration-500 hover:scale-[1.02]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y border-border/50 bg-slate-50/50 py-10">
          <div className="container mx-auto px-4 max-w-7xl">
            <p className="mb-6 text-center text-sm font-medium text-muted-foreground">Trusted by MSMEs applying to major lenders</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Mock Logos */}
              {['HDFC Bank', 'SBI', 'ICICI Bank', 'Bajaj Finserv', 'LendingKart'].map((brand) => (
                <div key={brand} className="flex items-center gap-2 text-xl font-bold text-slate-400">
                  <div className="h-6 w-6 rounded bg-current" />
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">Your 3-Step Path to Capital</h2>
              <p className="mt-4 text-lg text-muted-foreground">From chaos to clarity in three simple stages.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "1. Secure Ingestion",
                  desc: "Upload bank statements, ITR, and KYC into our bank-grade encrypted vault.",
                  icon: Upload,
                  color: "text-blue-600",
                  bg: "bg-blue-50"
                },
                {
                  title: "2. AI Deep Audit (RAG)",
                  desc: "Our engine reads every line, flagging red flags like bounced checks or low DTI ratios.",
                  icon: Sparkles,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50"
                },
                {
                  title: "3. Actionable Roadmap",
                  desc: "Get a personalized step-by-step plan to improve your score before you apply.",
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50"
                }
              ].map((step, idx) => (
                <Card key={idx} className="group relative overflow-hidden border-border/50 bg-white/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} ${step.color}`}>
                      <step.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-3 font-serif text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Deep Dive */}
        <section id="features" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-32">

            {/* Feature 1 */}
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  The RAG Underwriter Engine.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Most rejections happen because of hidden patterns you miss. Our Retrieval-Augmented Generation (RAG) agent scans years of transaction history to identify "Cash Flow Gaps" and "Cheque Bounces" that ruin credibility.
                </p>
                <ul className="space-y-4">
                  {['Identifies 99% of rejection triggers', 'Analyzes banking psychology', 'Benchmarks against lender criteria'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-2xl border border-border/50 bg-white shadow-2xl overflow-hidden">
                <Image
                  src="/images/feature1.png"
                  alt="RAG Underwriter Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid gap-12 lg:grid-cols-2 items-center lg:flex-row-reverse">
              <div className="order-last lg:order-first relative rounded-2xl border border-border/50 bg-white shadow-2xl overflow-hidden">
                <Image
                  src="/images/feature2.png"
                  alt="Financial Co-Pilot Chat"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Your AI Financial Co-Pilot.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Don't just see the problem, fix it. Our AI suggests specific actions—like "Lowering EMI burden" or "Consolidating debt"—to improve your creditworthiness score in real-time.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary font-semibold text-lg hover:no-underline group">
                  See how remediation works <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="container relative mx-auto px-4 max-w-4xl text-center space-y-8">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
              Ready to get funded?
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of MSMEs who prepared their documents with LendReady AI and got approved 3x faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-14 rounded-full bg-white text-primary hover:bg-white/90 px-8 text-lg font-bold shadow-2xl">
                Get Your Free Score
              </Button>
              <p className="text-sm opacity-70 mt-4 sm:mt-0 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Bank-grade encryption
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4 text-white">
                <ShieldCheck className="h-6 w-6" />
                <span className="font-serif text-xl font-bold">LendReady AI</span>
              </div>
              <p className="text-slate-400 max-w-xs mb-6">
                Empowering MSMEs with AI-driven insights for faster, fairer loan approvals.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholder */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded bg-slate-900 hover:bg-slate-800 transition-colors" />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 nav-links">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 nav-links">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 nav-links">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-12 pt-8 text-center text-sm text-slate-500">
            © 2024 LendReady AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
