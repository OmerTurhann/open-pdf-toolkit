import React from 'react'
import { CATEGORIES, TOOLS } from '../tools.js'

export default function HomeGrid({ onOpenTool }) {
  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => {
        const tools = TOOLS.filter((t) => t.category === cat.id)
        if (tools.length === 0) return null
        return (
          <section key={cat.id}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/45 mb-4">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const disabled = tool.status !== 'ready'
                return (
                  <button
                    key={tool.id}
                    disabled={disabled}
                    onClick={() => onOpenTool(tool.id)}
                    className={`text-left bg-white border border-ink/10 rounded-xl p-4 flex items-start gap-3 transition-all
                      ${disabled ? 'opacity-45 cursor-not-allowed' : 'hover:shadow-md hover:border-accent/40 hover:-translate-y-0.5'}`}
                  >
                    <span className={`shrink-0 w-10 h-10 rounded-lg ${tool.color} text-white font-display font-semibold flex items-center justify-center`}>
                      {tool.badge}
                    </span>
                    <span>
                      <span className="block font-medium text-ink text-sm">
                        {tool.title}
                        {disabled && <span className="ml-2 text-[10px] font-mono uppercase bg-ink/8 text-ink/45 px-1.5 py-0.5 rounded">yakında</span>}
                      </span>
                      <span className="block text-xs text-ink/45 mt-0.5 leading-relaxed">{tool.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
