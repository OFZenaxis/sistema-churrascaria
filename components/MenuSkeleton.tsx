"use client"

import React from 'react'

export default function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-pulse">
      <div className="lg:col-span-2 space-y-8">
        <div className="h-10 bg-zinc-800 w-1/3 rounded-xl"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#111] rounded-3xl border border-zinc-800 p-6 h-[220px] flex flex-col justify-between">
              <div>
                <div className="h-8 bg-zinc-800 w-3/4 rounded mb-4"></div>
                <div className="h-4 bg-zinc-800 w-full rounded mb-2"></div>
                <div className="h-4 bg-zinc-800 w-5/6 rounded"></div>
              </div>
              <div className="flex justify-between items-end">
                <div className="h-8 bg-zinc-800 w-1/3 rounded"></div>
                <div className="h-10 bg-zinc-800 w-24 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="bg-[#111] h-[400px] rounded-3xl border border-zinc-800 p-6">
          <div className="h-8 bg-zinc-800 w-1/2 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-16 bg-[#0a0a0a] rounded-2xl"></div>
            <div className="h-16 bg-[#0a0a0a] rounded-2xl"></div>
          </div>
          <div className="mt-auto pt-24">
             <div className="h-16 bg-zinc-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
