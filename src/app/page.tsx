import Link from "next/link";
import { Zap, Eye, BarChart3, Brain, ArrowRight, Shield, Globe, FileText } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black-ink">
      <header className="border-b-2 border-red-hot bg-black-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-red-hot uppercase tracking-tight">
              BRAND DNA // ANALYZER
            </h1>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-sm text-white-dim hover:text-white transition-colors uppercase tracking-wide">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-white-muted hover:text-white transition-colors uppercase tracking-wide">
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight text-red-hot uppercase">
            Competitive Brand<br />Intelligence
          </h2>
          <p className="mt-6 text-lg text-white-muted max-w-3xl mx-auto uppercase tracking-wide">
            Scrape real ad data. Extract visual DNA. Get strategic analysis.
          </p>
          <p className="mt-4 text-base text-white-dim max-w-2xl mx-auto">
            AIDEN&apos;s phantom brain analyzes Facebook Ad Library data, extracts color DNA
            from logos and ad creatives, gathers PR and press intelligence, and delivers
            competitive strategy in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-red-hot text-white px-8 py-4 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border-2 border-border-subtle text-white px-8 py-4 text-sm font-bold uppercase tracking-wide hover:bg-white/5 transition-all"
            >
              View Pricing
            </Link>
          </div>

          <p className="mt-4 text-xs text-white-dim uppercase tracking-wide">
            2 free audits per month — no credit card required
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {[
            { icon: Eye, label: "Ad Library Scraping", desc: "50+ ads per brand from Facebook Ad Library" },
            { icon: Zap, label: "Color DNA Extraction", desc: "Logo and ad creative palette analysis" },
            { icon: Brain, label: "AIDEN Strategic Analysis", desc: "Phantom brain competitive strategy" },
            { icon: BarChart3, label: "Ad Analytics", desc: "Platform, format & CTA breakdowns" },
            { icon: Globe, label: "Brand Intel", desc: "PR, press, activations & campaigns" },
            { icon: Shield, label: "Visual DNA", desc: "Side-by-side brand comparison" },
            { icon: FileText, label: "PDF Export", desc: "Shareable professional reports" },
            { icon: ArrowRight, label: "Shareable Links", desc: "Send reports to stakeholders" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-black-deep border-2 border-border-subtle p-6 hover:border-red-hot/30 transition-colors">
              <Icon className="h-6 w-6 text-orange-accent mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">{label}</h3>
              <p className="text-xs text-white-dim mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">
            Ready to decode your competitors?
          </h3>
          <p className="text-sm text-white-dim mb-6">
            Join the brands already using AIDEN for competitive intelligence.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-red-hot text-white px-8 py-4 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t-2 border-red-hot bg-black-deep mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white-dim uppercase tracking-wide">
              Brand DNA Analyzer // Powered by AIDEN &amp; Redbaez
            </p>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-xs text-white-dim hover:text-white uppercase tracking-wide transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-xs text-white-dim hover:text-white uppercase tracking-wide transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
