import { cn } from "@/lib/utils"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, CheckCircle, Lock, PieChart, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white selection:bg-blue-100">

      {/* Navigation */}
      <header className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            FinPlan.AI
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer">Log in</span>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              The Future of Wealth Planning
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
              Master Your Money with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI Precision</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in-0 slide-in-from-bottom-8 duration-800">
              Stop guessing. Get a comprehensive, AI-driven financial roadmap that adapts to your life. From retirement planning to daily cash flow, we have you covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in-0 slide-in-from-bottom-10 duration-1000">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all">
                  Start Planning Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Mockup Image */}
            <div className="mt-20 relative mx-auto max-w-5xl">
              <div className="rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm p-2 shadow-2xl lg:rounded-3xl">
                <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 overflow-hidden relative group">
                  {/* Placeholder for actual dashboard screenshot */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                    <div className="text-center">
                      <BarChart size={48} className="mx-auto mb-2 opacity-50 text-blue-500" />
                      <p>Interactive Financial Dashboard</p>
                    </div>
                  </div>
                  {/* Overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/50 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to grow your wealth</h2>
              <p className="text-gray-600">Professional-grade tools simplified for everyone.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<PieChart className="w-6 h-6 text-blue-600" />}
                title="Smart Asset Tracking"
                description="Visualize your entire portfolio - Real Estate, Stocks, and Bank Accounts in one unified view."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
                title="Risk Analysis"
                description="Our AI engine identifies gaps in your insurance coverage and emergency funds automatically."
                delay="100"
              />
              <FeatureCard
                icon={<BarChart className="w-6 h-6 text-purple-600" />}
                title="Retirement Projection"
                description="Calculate exactly how much you need to save monthly to retire comfortably at your desired age."
                delay="200"
              />
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>&copy; 2026 FinPlan AI. Secure. Private. Intelligent.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay = "0" }: any) {
  return (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: `${delay}ms` }}>
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
