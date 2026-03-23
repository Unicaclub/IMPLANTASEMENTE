'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Layers, Zap, GitBranch, ArrowRight, Database, Code2, MonitorSmartphone, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-coal-950">
      {/* Nav */}
      <nav className="border-b border-coal-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Cpu size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-coal-50">Copalite</span>
          </div>
          <Link href="/auth/login" className="btn-primary gap-2 text-sm">
            Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">AI-Powered Software Discovery</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-coal-50 leading-tight">
            Mapeamento inteligente de software{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              com agentes AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-coal-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            Conecte seu repositorio. Em 35 segundos, tenha o raio-x completo do sistema:
            modulos, APIs, schemas, telas e backlog priorizado.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link href="/auth/login" className="btn-primary px-8 py-3 text-base gap-2">
              Comecar agora <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              { value: '9', label: 'Agentes AI' },
              { value: '34', label: 'Registries em 35s' },
              { value: '4', label: 'Pipelines' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-coal-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-coal-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-coal-50 text-center mb-12">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: '9 Agentes Especializados',
                description: 'Orchestrator, Architect, Schema Mapper, API Analyzer, UI Inspector, Code Auditor, Evidence Collector, Comparator, Report Generator.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/10',
              },
              {
                icon: GitBranch,
                title: 'Multi-Provider AI',
                description: 'Funciona com Claude, GPT-4o, Gemini ou Ollama local. Escolha o provider ideal para cada projeto.',
                color: 'text-sky-400',
                bg: 'bg-sky-500/10',
              },
              {
                icon: Zap,
                title: 'Discovery Automatico',
                description: 'De codigo legado a backlog priorizado em minutos. Sem configuracao manual, sem estimativas falsas.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 hover:border-coal-700 transition-all">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon size={20} className={feature.color} />
                </div>
                <h3 className="text-base font-semibold text-coal-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-coal-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-coal-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-coal-50 text-center mb-12">
            4 passos para o raio-x completo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', icon: GitBranch, title: 'Conecte', desc: 'Adicione seu repositorio (GitHub, GitLab, etc.)' },
              { step: '2', icon: Cpu, title: 'Analise', desc: 'Os 9 agentes analisam o codigo automaticamente' },
              { step: '3', icon: Database, title: 'Descubra', desc: 'Modulos, APIs, schemas e telas mapeados' },
              { step: '4', icon: Shield, title: 'Priorize', desc: 'Backlog com bugs, gaps e melhorias priorizadas' },
            ].map((item) => (
              <div key={item.step} className="text-center p-5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-emerald-400">{item.step}</span>
                </div>
                <h4 className="text-sm font-semibold text-coal-100 mb-1">{item.title}</h4>
                <p className="text-xs text-coal-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registries preview */}
      <section className="px-6 py-16 border-t border-coal-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-coal-50 mb-4">
            Registries populados automaticamente
          </h2>
          <p className="text-coal-400 mb-8">Dados reais extraidos por agentes AI em uma unica execucao</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: Layers, label: 'Modules', color: 'text-violet-400' },
              { icon: Code2, label: 'APIs', color: 'text-emerald-400' },
              { icon: Database, label: 'Schemas', color: 'text-amber-400' },
              { icon: MonitorSmartphone, label: 'UI Screens', color: 'text-rose-400' },
              { icon: Shield, label: 'Evidence', color: 'text-teal-400' },
            ].map((reg) => (
              <div key={reg.label} className="card p-4 hover:border-coal-700 transition-all">
                <reg.icon size={20} className={`${reg.color} mx-auto mb-2`} />
                <p className="text-xs text-coal-300 font-medium">{reg.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-t border-coal-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-coal-50 mb-4">
            Pronto para mapear seu sistema?
          </h2>
          <p className="text-coal-400 mb-8">
            Comece gratis. Nenhum cartao de credito necessario.
          </p>
          <Link href="/auth/login" className="btn-primary px-8 py-3 text-base gap-2 inline-flex">
            Comecar agora <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-coal-800/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Cpu size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-coal-400">Copalite</span>
          </div>
          <p className="text-xs text-coal-600">Mapeamento inteligente de software com agentes AI</p>
        </div>
      </footer>
    </div>
  );
}
