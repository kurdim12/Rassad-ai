import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Gavel,
  History,
  Languages,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AgentInfo, fetchAgents } from "../lib/api";

const ICON: Record<string, typeof Search> = {
  language: Languages,
  search: Search,
  shield: ShieldCheck,
  alert: AlertTriangle,
  history: History,
  gavel: Gavel,
};

export function AgentsShowcase() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  useEffect(() => {
    fetchAgents()
      .then((r) => setAgents(r.agents))
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <section id="agents" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="chip mb-3">نظام متعدد الوكلاء</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            ستة وكلاء يعملون كفريق
          </h2>
          <p className="text-slate-400 mt-3">
            بدلاً من نموذج واحد يجيب على كل شيء، يقسم RASAD التحقق إلى مهام متخصصة،
            ثم يدمج النتائج في حكم واحد مدعم بالأدلة.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a, i) => {
            const Icon = ICON[a.icon] || Search;
            return (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass rounded-2xl p-5 glass-hover"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 ring-1 ring-white/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand-300" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-violet-300">{a.name}</div>
                    <div className="font-bold">{a.role_ar}</div>
                  </div>
                </div>
                <p dir="ltr" className="text-xs text-slate-400 text-left">
                  {a.role_en}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
