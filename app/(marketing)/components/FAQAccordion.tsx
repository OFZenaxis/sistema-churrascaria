'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FAQ = { q: string; a: string }

export default function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const left = faqs.slice(0, 5)
  const right = faqs.slice(5, 10)

  function toggle(globalIdx: number) {
    setOpenIndex(prev => (prev === globalIdx ? null : globalIdx))
  }

  function Item({ faq, globalIdx }: { faq: FAQ; globalIdx: number }) {
    const isOpen = openIndex === globalIdx
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <button
          type="button"
          onClick={() => toggle(globalIdx)}
          className="w-full flex items-center justify-between p-5 font-bold text-slate-900 text-sm hover:text-rose-600 transition-colors gap-4 text-left"
          aria-expanded={isOpen}
        >
          {faq.q}
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'text-rose-500 -rotate-180' : 'text-slate-400'}`} />
          </div>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 text-slate-500 font-medium leading-relaxed text-sm">
            {faq.a}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      <div className="flex flex-col gap-3 md:gap-4">
        {left.map((faq, i) => (
          <Item key={i} faq={faq} globalIdx={i} />
        ))}
      </div>
      <div className="flex flex-col gap-3 md:gap-4">
        {right.map((faq, i) => (
          <Item key={i + 5} faq={faq} globalIdx={i + 5} />
        ))}
      </div>
    </div>
  )
}
