import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reportService';
import { taskService } from '../services/taskService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { formatDate, isOverdue, statusMeta, toneFillClass } from '../lib/labels';
import { cn } from '../lib/utils';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Inbox,
  Users,
} from 'lucide-react';

const SectionLink = ({ to, children }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
    {children} <ArrowRight className="h-3 w-3" />
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const canManageTasks = ['super_admin', 'admin'].includes(user?.role);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, tasksRes] = await Promise.allSettled([
          // All-time figures so the KPIs, overdue list and recent tasks describe the same set of work.
          reportService.getAnalytics({ period: 'all' }),
          user?.role === 'staff' ? taskService.getMyTasks({ limit: 6 }) : taskService.getAll({ limit: 6 }),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
          setAnalytics(analyticsRes.value.data);
        }

        if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value?.data)) {
          setRecentTasks(tasksRes.value.data.slice(0, 6));
        }
      } catch (err) {
        console.warn('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.role]);

  const summary = analytics?.summary || {};
  const overdueCount = summary.overdueCount || 0;
  const completionRate = summary.completionRateNum || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Welcome back, <span className="font-medium text-foreground">{user?.firstName}</span>.
            {' '}Here is where your team's work stands today.
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/reports">
                <BarChart3 className="h-4 w-4" /> Reports
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to={canManageTasks ? '/tasks' : '/tasks/board'}>
                <ClipboardList className="h-4 w-4" /> {canManageTasks ? 'Manage tasks' : 'My tasks'}
              </Link>
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={summary.totalTasks ?? 0}
          icon={ClipboardList}
          tone="primary"
          loading={loading}
          footer={`${summary.activeTasks ?? 0} still open`}
        />
        <StatCard
          label="In progress"
          value={summary.inProgressTasks ?? 0}
          icon={Clock}
          tone="info"
          loading={loading}
          footer={`${summary.pendingTasks ?? 0} pending in queue`}
        />
        <StatCard
          label="Completed"
          value={summary.completedTasks ?? 0}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
          footer={
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${completionRate}%` }} />
              </div>
              <span className="tabular">{summary.completionRate || '0.0%'}</span>
            </div>
          }
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          tone={overdueCount > 0 ? 'danger' : 'neutral'}
          loading={loading}
          footer={overdueCount > 0 ? <span className="text-danger">Requires attention</span> : 'All tasks on schedule'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
            <div className="space-y-1">
              <CardTitle>Recent tasks</CardTitle>
              <CardDescription>Latest activity across your workspace</CardDescription>
            </div>
            <SectionLink to={canManageTasks ? '/tasks' : '/tasks/board'}>View all</SectionLink>
          </CardHeader>
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
            </div>
          ) : recentTasks.length > 0 ? (
            <ul className="divide-y">
              {recentTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {task.assignee
                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                        : task.assignedTo ? (task.assignedTo === user?.id ? 'Assigned to you' : 'Assigned') : 'Unassigned'}
                      {task.dueDate && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span className={cn(isOverdue(task) && 'font-medium text-danger')}>
                            Due {formatDate(task.dueDate)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} className="hidden sm:inline-flex" />
                  <StatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Inbox} title="No tasks yet" description="Tasks you create or are assigned will appear here." />
          )}
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader className="border-b py-4">
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>All tasks by lifecycle stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {(analytics?.statusBreakdown || []).map((item) => {
              const meta = statusMeta(item.status);
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', toneFillClass[meta.tone])} />
                      {meta.label}
                    </span>
                    <span className="tabular text-muted-foreground">
                      <span className="font-medium text-foreground">{item.count}</span> · {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', toneFillClass[meta.tone])}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!loading && !analytics?.statusBreakdown?.length && (
              <p className="py-6 text-center text-xs text-muted-foreground">No tasks recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
            <div className="space-y-1">
              <CardTitle>Overdue tasks</CardTitle>
              <CardDescription>Items past their due date</CardDescription>
            </div>
            <SectionLink to="/reports">Details</SectionLink>
          </CardHeader>
          {analytics?.overdueTasks?.length > 0 ? (
            <ul className="divide-y">
              {analytics.overdueTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.assignee}</p>
                  </div>
                  <span className="tabular shrink-0 text-xs font-medium text-danger">{t.dueDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle2} title="Nothing overdue" description="All open tasks are on track." />
          )}
        </Card>

        {/* Workload */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
            <div className="space-y-1">
              <CardTitle>Team workload</CardTitle>
              <CardDescription>Completion by contributor</CardDescription>
            </div>
            <SectionLink to="/reports">Full breakdown</SectionLink>
          </CardHeader>
          {analytics?.workloadBreakdown?.length > 0 ? (
            <CardContent className="space-y-4 pt-5">
              {analytics.workloadBreakdown.slice(0, 5).map((w) => (
                <div key={w.userId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{w.name}</span>
                    <span className="tabular text-muted-foreground">
                      {w.completed}/{w.total} · {w.completionRate}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${w.completionRate}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          ) : (
            <EmptyState icon={Users} title="No workload recorded" description="Assign tasks to team members to see their capacity." />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
