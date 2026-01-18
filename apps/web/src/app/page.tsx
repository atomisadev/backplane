"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Database,
  Share2,
  ShieldCheck,
  Zap,
  GitBranch,
  Activity,
  Box,
  Terminal,
  Server,
  Command,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";

function FadeIn({
  children,
  delay = 0,
  className,
  yOffset = 20,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  yOffset?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={
        {
          transitionDelay: `${delay}ms`,
          "--y-offset": `${yOffset}px`,
        } as React.CSSProperties
      }
      className={cn(
        "transition-all duration-1000 ease-out transform will-change-transform",
        isVisible
          ? "opacity-100 translate-y-0 filter-none"
          : "opacity-0 translate-y-[var(--y-offset)] blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background"></div>
    </div>
  );
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between will-change-transform",
        isScrolled
          ? "top-4 w-[90%] max-w-3xl rounded-full border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0px_20px_50px_-10px_rgba(0,0,0,0.5)] py-2 pl-4 pr-2"
          : "top-0 w-full max-w-7xl border-transparent bg-transparent py-6 px-6",
      )}
    >
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/sign-in"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
        >
          Sign In
        </Link>
        <Link href="/sign-up">
          <Button
            size="sm"
            className={cn(
              "rounded-full transition-all duration-500",
              isScrolled ? "h-9 px-4 text-xs" : "h-10 px-6 text-sm",
            )}
          >
            Get Started
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]" />
      <GridBackground />

      <div className="max-w-5xl mx-auto text-center space-y-8 z-10">
        <FadeIn delay={100} yOffset={40}>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200 mb-6 hover:bg-blue-500/20 transition-colors cursor-default">
            <Code2 className="size-3" />
            Submitted to UnitedHacks V6!
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-foreground mb-6">
            Stop guessing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40">
              Start seeing.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={200} yOffset={30}>
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed font-light">
            The visual interface for your PostgreSQL databases. Introspect
            schemas, visualize relationships, and migrate with confidence.
          </p>
        </FadeIn>

        <FadeIn delay={300} yOffset={20}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full text-base bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-[0_0_50px_-15px_rgba(255,255,255,0.3)]"
              >
                Start Visualizing <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link
              href="https://github.com/atomisadev/backplane"
              target="_blank"
            >
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full text-base bg-transparent border-white/10 hover:bg-white/5 transition-all group"
              >
                <GitBranch className="mr-2 size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                View GitHub
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function InterfaceMockup() {
  return (
    <section className="px-4 pb-24 relative z-20 -mt-20 md:-mt-32 pointer-events-none">
      <FadeIn delay={400} className="max-w-7xl mx-auto">
        <div className="group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[2.2/1] transition-all hover:border-white/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/5 bg-white/5 flex items-center justify-between px-6">
            <div className="flex gap-2">
              <div className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="size-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
              <div className="size-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-20 bg-white/10 rounded-full" />
              <div className="h-1.5 w-10 bg-white/10 rounded-full" />
            </div>
          </div>

          <div className="absolute inset-0 top-12 flex items-center justify-center scale-90 md:scale-100">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-card/90 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-20 transition-transform duration-500 group-hover:scale-105">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="size-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Users
                  </span>
                </div>
                <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="p-3 space-y-3">
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>id</span>
                  <span className="text-primary">UUID</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>email</span>
                  <span className="text-blue-400">VARCHAR</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>created_at</span>
                  <span className="text-amber-400">TIMESTAMP</span>
                </div>
              </div>
            </div>

            <div className="absolute top-1/3 left-1/4 w-52 bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl z-10 animate-in slide-in-from-left-4 fade-in duration-1000 delay-300">
              <div className="px-4 py-3 border-b border-white/5">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Box className="size-3" />
                  Orders
                </span>
              </div>
              <div className="p-3 space-y-2 opacity-60">
                <div className="h-1.5 w-full bg-white/10 rounded" />
                <div className="h-1.5 w-2/3 bg-white/10 rounded" />
              </div>
            </div>

            <div className="absolute bottom-1/3 right-1/4 w-52 bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl z-10 animate-in slide-in-from-right-4 fade-in duration-1000 delay-500">
              <div className="px-4 py-3 border-b border-white/5">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Activity className="size-3" />
                  Analytics
                </span>
              </div>
              <div className="p-3 space-y-2 opacity-60">
                <div className="h-1.5 w-full bg-white/10 rounded" />
                <div className="h-1.5 w-3/4 bg-white/10 rounded" />
              </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 32% 40% C 40% 40%, 40% 50%, 48% 50%"
                fill="none"
                stroke="url(#gradient-line)"
                strokeWidth="2"
                className="opacity-40 animate-pulse"
              />
              <path
                d="M 68% 60% C 60% 60%, 60% 50%, 52% 50%"
                fill="none"
                stroke="url(#gradient-line)"
                strokeWidth="2"
                className="opacity-40 animate-pulse delay-75"
              />
              <defs>
                <linearGradient
                  id="gradient-line"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="white" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function BentoGrid() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Everything you need <br />
            <span className="text-muted-foreground">to master your data.</span>
          </h2>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[300px]">
        <FadeIn delay={0} className="md:col-span-4 row-span-1">
          <div className="h-full rounded-3xl border border-white/10 bg-muted/5 p-8 relative overflow-hidden group hover:bg-muted/10 transition-colors">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="size-10 rounded-lg bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                  <Share2 className="size-5 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  Instant Introspection
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Connect your DB and get a live graph instantly. No manual
                  setup required.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Badge
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm border-border/40"
                >
                  PostgreSQL
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm border-border/40"
                >
                  MySQL
                </Badge>
              </div>
            </div>
            <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute right-[-20px] top-[20px] w-[300px] border border-border/40 bg-background/80 backdrop-blur rounded-xl p-4 shadow-xl -rotate-6 transition-transform group-hover:-rotate-3 group-hover:scale-105 duration-500">
              <div className="space-y-3">
                <div className="h-3 w-3/4 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse delay-75" />
                <div className="h-3 w-full bg-muted/50 rounded animate-pulse delay-150" />
                <div className="flex gap-2 pt-2">
                  <div className="size-8 rounded bg-muted/30" />
                  <div className="size-8 rounded bg-muted/30" />
                  <div className="size-8 rounded bg-muted/30" />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={100} className="md:col-span-2 row-span-1 md:row-span-2">
          <div className="h-full rounded-3xl border border-white/10 bg-black/40 p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="size-10 rounded-lg bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <Server className="size-5 text-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Instant Mock API</h3>
              <p className="text-muted-foreground mb-6">
                Unblock your frontend. Auto-generate REST endpoints from your
                schema instantly.
              </p>
              <div className="flex-1 rounded-xl bg-muted/10 border border-white/5 p-4 font-mono text-[10px] text-muted-foreground overflow-hidden hover:bg-muted/15 transition-colors flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
                  <div className="size-2 rounded-full bg-red-500/50" />
                  <div className="size-2 rounded-full bg-amber-500/50" />
                  <div className="size-2 rounded-full bg-green-500/50" />
                  <span className="ml-auto text-muted-foreground/50">bash</span>
                </div>
                <div className="text-foreground">
                  <span className="text-green-400">$</span> curl
                  /api/mock/users/1
                </div>
                <div className="text-blue-400 mt-2">{`{`}</div>
                <div className="pl-4">
                  <span className="text-purple-400">"id"</span>:{" "}
                  <span className="text-orange-400">"user_123"</span>,
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">"name"</span>:{" "}
                  <span className="text-orange-400">"Alice Dev"</span>,
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">"role"</span>:{" "}
                  <span className="text-orange-400">"admin"</span>
                </div>
                <div className="text-blue-400">{`}`}</div>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="md:col-span-2 row-span-1">
          <div className="h-full rounded-3xl border border-white/10 bg-muted/5 p-8 relative overflow-hidden group hover:bg-muted/10 transition-colors">
            <div className="relative z-10">
              <ShieldCheck className="size-8 text-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Safe Migrations</h3>
              <p className="text-sm text-muted-foreground">
                Preview destructive changes before they happen. Automatic
                rollback protection.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full" />
          </div>
        </FadeIn>

        <FadeIn delay={300} className="md:col-span-2 row-span-1">
          <div className="h-full rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 to-muted/5 p-8 relative overflow-hidden group">
            <div className="relative z-10">
              <Zap className="size-8 text-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Built on Rust and Bun for millisecond latency. No Electron
                bloat.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] -z-10" />
      <FadeIn yOffset={20}>
        <div className="max-w-3xl mx-auto space-y-8 p-8 md:p-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Ready to visualize your data?
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto font-light">
            Join developers building complex data architectures with clarity and
            speed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full text-base bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto shadow-lg"
              >
                Get Started for Free
              </Button>
            </Link>
            <Link
              href="https://github.com/atomisadev/backplane"
              target="_blank"
            >
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full text-base w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5"
              >
                <GitBranch className="mr-2 size-4" /> Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-6 bg-black/40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        <div className="text-sm text-muted-foreground/40 font-mono">
          © 2026 Backplane.
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <InterfaceMockup />
        <BentoGrid />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
