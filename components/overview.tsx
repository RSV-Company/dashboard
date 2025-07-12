"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 1900 },
  { name: "Mar", total: 800 },
  { name: "Apr", total: 1800 },
  { name: "May", total: 2000 },
  { name: "Jun", total: 2400 },
  { name: "Jul", total: 2200 },
  { name: "Aug", total: 2800 },
  { name: "Sep", total: 2600 },
  { name: "Oct", total: 3200 },
  { name: "Nov", total: 3000 },
  { name: "Dec", total: 3400 },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
