import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react'

interface ProductionStatsProps {
  byStatus: Record<string, number>
  totalLaborCost: number
  formatCurrency: (amount: number) => string
}

export function ProductionStats({ byStatus, totalLaborCost, formatCurrency }: ProductionStatsProps) {
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0)
  const completionRate = total > 0
    ? ((byStatus.completed || 0) / total * 100).toFixed(1)
    : '0'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{byStatus.pending || 0}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting start
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Factory className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{byStatus.in_progress || 0}</div>
          <p className="text-xs text-muted-foreground">
            Currently being made
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{byStatus.completed || 0}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Labor Cost</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalLaborCost)}</div>
          <p className="text-xs text-muted-foreground">
            All time
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
