import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Upload, Sparkles, MessageCircle, BarChart3, CheckCircle2, ChevronRight, Lock, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { auth } from "@/auth";
import { SampleReportButton } from "@/components/landing/sample-report-button";


export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary/10">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#1F1E1D]">CreditSetu AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button className="hidden md:inline-flex rounded-full bg-[#D46B4F] px-6 font-semibold text-white shadow-lg shadow-[#D46B4F]/20 hover:bg-[#C45A3E]">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/api/auth/signin">
                  <Button variant="ghost" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="hidden md:inline-flex rounded-full bg-[#D46B4F] px-6 font-semibold text-white shadow-lg shadow-[#D46B4F]/20 hover:bg-[#C45A3E]">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
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
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16 bg-[#FAFAF8]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D46B4F]/5 via-[#FAFAF8] to-[#FAFAF8]" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary w-fit">
                  <Sparkles className="mr-2 h-3.5 w-3.5 fill-primary/20" />
                  Hackathon 2025 Finalist
                </div> */}
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1F1E1D] sm:text-5xl xl:text-6xl/none">
                    Stop getting rejected. <br />
                    <span className="text-[#D46B4F]">Get Loan Ready.</span>
                  </h1>
                  <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                    60% of MSME loans fail due to bad paperwork. Our AI auditor pre-checks your documents and builds your path to approval in minutes, not weeks.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard">
                    <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-xl shadow-[#D46B4F]/20 group bg-[#D46B4F] hover:bg-[#C45A3E] text-white">
                      Start Your Free Audit
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <SampleReportButton />
                </div>
                {/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p>Trusted by 200+ MSMEs to secure capital.</p>
                </div> */}
              </div>
              <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none h-[500px] animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <div className="relative aspect-square w-full sm:aspect-[4/3] lg:aspect-square">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#D46B4F]/10 to-transparent blur-2xl" />
                  <Image
                    src="/Gemini_Generated_Image_2mnjwy2mnjwy2mnj.png"
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
            <p className="mb-6 text-center text-sm font-medium text-muted-foreground">Supports MSMEs applying to major lenders</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Mock Logos */}
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {[
                  { name: 'HDFC Bank', src: '/bank/HDFCBank.jpg' },
                  { name: 'SBI', src: '/bank/sbi.webp' },
                  { name: 'ICICI Bank', src: '/bank/ICICIBank.jpg' },
                  { name: 'Bajaj Finserv', src: '/bank/BAJAJFINSERV.jpg' },
                  { name: 'LendingKart', src: '/bank/lendingkart.jpg' }
                ].map((brand) => (
                  <div key={brand.name} className="flex items-center gap-2 relative h-12 w-32">
                    <img
                      src={brand.src}
                      alt={brand.name}
                      className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section >

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
          {/* Abstract Background Blob */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#FDF4F0] rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#F0F7F4] rounded-full blur-3xl opacity-50" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mx-auto max-w-2xl text-center mb-16 space-y-4">
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-[#2D1810]">Your 3-Step Path to Capital</h2>
              <p className="text-lg text-[#5D4E49]">From chaos to clarity in three simple stages.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "1. Secure Ingestion",
                  desc: "Upload bank statements, ITR, and KYC into our bank-grade encrypted vault.",
                  icon: Upload,
                },
                {
                  title: "2. AI Deep Audit (RAG)",
                  desc: "Our engine reads every line, flagging red flags like bounced checks or low DTI ratios.",
                  icon: Sparkles,
                },
                {
                  title: "3. Actionable Roadmap",
                  desc: "Get a personalized step-by-step plan to improve your score before you apply.",
                  icon: CheckCircle2,
                }
              ].map((step, idx) => (
                <Card key={idx} className="group relative overflow-hidden border-none bg-[#FAFAF8] transition-all duration-500 ease-out hover:shadow-[0_20px_40px_-12px_rgba(212,107,79,0.1)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98] rounded-[2rem]">
                  <CardContent className="p-10 flex flex-col items-start gap-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#FDF4F0] text-[#D46B4F] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#D46B4F] group-hover:text-white group-hover:rotate-6">
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-serif text-2xl font-bold text-[#2D1810]">{step.title}</h3>
                      <p className="text-[#5D4E49] leading-relaxed text-[15px]">
                        {step.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section >

        {/* Feature Deep Dive */}
        <section id="features" className="py-32 bg-[#FAFAF8]" >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-32">

            {/* Feature 1 */}
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[#FDF4F0] text-[#D46B4F] transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-4xl font-bold tracking-tight text-[#2D1810] sm:text-5xl">
                  The RAG Underwriter Engine.
                </h2>
                <p className="text-xl text-[#5D4E49] leading-relaxed">
                  Most rejections happen because of hidden patterns you miss. Our Retrieval-Augmented Generation (RAG) agent scans years of transaction history to identify "Cash Flow Gaps" and "Cheque Bounces" that ruin credibility.
                </p>
                <ul className="space-y-5">
                  {['Identifies 99% of rejection triggers', 'Analyzes banking psychology', 'Benchmarks against lender criteria'].map((item) => (
                    <li key={item} className="flex items-center gap-4 group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF4F0] text-[#D46B4F] group-hover:bg-[#D46B4F] group-hover:text-white transition-all duration-300 group-hover:scale-110">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-[#4A3B36] text-lg transition-colors group-hover:text-[#D46B4F]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-[2.5rem] border border-[#E6DCD5] bg-white shadow-2xl shadow-[#D46B4F]/5 overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_30px_60px_-12px_rgba(212,107,79,0.15)]">
                <Image
                  src="/Gemini_Generated_Image_786skv786skv786s.png"
                  alt="RAG Underwriter Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid gap-16 lg:grid-cols-2 items-center lg:flex-row-reverse">
              <div className="order-last lg:order-first relative rounded-[2.5rem] border border-[#E6DCD5] bg-white shadow-2xl shadow-[#D46B4F]/5 overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_30px_60px_-12px_rgba(212,107,79,0.15)]">
                <Image
                  src="/Gemini_Generated_Image_k5gfw5k5gfw5k5gf.png"
                  alt="Financial Co-Pilot Chat"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[#FDF4F0] text-[#D46B4F] transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-4xl font-bold tracking-tight text-[#2D1810] sm:text-5xl">
                  Your AI Financial Co-Pilot.
                </h2>
                <p className="text-xl text-[#5D4E49] leading-relaxed">
                  Don't just see the problem, fix it. Our AI suggests specific actions—like "Lowering EMI burden" or "Consolidating debt"—to improve your creditworthiness score in real-time.
                </p>
                <Button variant="link" className="p-0 h-auto text-[#D46B4F] font-bold text-lg hover:no-underline group items-center">
                  See how remediation works <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

          </div>
        </section >

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-[#D46B4F] to-[#C45A3E] text-white relative overflow-hidden">
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="container relative mx-auto px-4 max-w-4xl text-center space-y-8">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
              Ready to get funded?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of MSMEs who prepared their documents with CreditSetu AI and got approved 3x faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 rounded-full bg-white text-[#D46B4F] hover:bg-white/90 px-8 text-lg font-bold shadow-2xl">
                  Get Your Free Score
                </Button>
              </Link>
              <p className="text-sm opacity-80 mt-4 sm:mt-0 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Bank-grade encryption
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        < footer className="bg-[#2D1810] text-[#E0D8D6] py-12 border-t border-[#3E241A]" >
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4 text-white">
                  <ShieldCheck className="h-6 w-6 text-[#D46B4F]" />
                  <span className="font-serif text-xl font-bold">CreditSetu AI</span>
                </div>
                <p className="text-[#CFC1BD] max-w-xs mb-6">
                  Empowering MSMEs with AI-driven insights for faster, fairer loan approvals.
                </p>
                <div className="flex gap-4">
                  <Link href="#" aria-label="Twitter" className="flex h-8 w-8 items-center justify-center rounded bg-[#3E241A] hover:bg-[#D46B4F] transition-colors text-white">
                    <Twitter className="h-4 w-4" />
                  </Link>
                  <Link href="#" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded bg-[#3E241A] hover:bg-[#D46B4F] transition-colors text-white">
                    <Linkedin className="h-4 w-4" />
                  </Link>
                  <Link href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded bg-[#3E241A] hover:bg-[#D46B4F] transition-colors text-white">
                    <Instagram className="h-4 w-4" />
                  </Link>
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
            <div className="border-t border-[#3E241A] mt-12 pt-8 text-center text-sm text-[#CFC1BD]">
              © 2025 CreditSetu AI. All rights reserved.
            </div>
          </div>
        </footer >
      </main>
    </div >
  );
}
