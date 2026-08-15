import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ClipboardList, MessageSquare } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Total Tasks',
      value: '0',
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      title: 'Team Members',
      value: '0',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'AI Chat Sessions',
      value: '0',
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Welcome back, {user?.firstName} {user?.lastName}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>

                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-500">
              No tasks assigned yet.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-500">
              No recent activity.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default Dashboard