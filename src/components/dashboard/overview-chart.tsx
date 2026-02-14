'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface OverviewChartProps {
    data: {
        name: string
        total: number
    }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-white/10 bg-black/80 p-3 shadow-xl backdrop-blur-md">
                <p className="mb-1 text-sm font-medium text-white">{label}</p>
                <p className="text-sm font-bold text-primary">
                    {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 0,
                    }).format(payload[0].value)}
                </p>
            </div>
        )
    }
    return null
}

export function OverviewChart({ data }: OverviewChartProps) {
    // If no data, show a placeholder or empty state
    if (!data || data.length === 0) {
        return (
            <Card className="glass col-span-4 max-h-[400px]">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>No data available for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 h-[350px] flex items-center justify-center text-muted-foreground">
                    No info
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass col-span-4">
            <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(180deg, rgba(236, 72, 153, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
                                    pointerEvents: 'none',
                                }}
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₦${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#ec4899"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 8, strokeWidth: 0, fill: "#fff" }}
                                filter="url(#glow)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
