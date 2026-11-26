import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { reportService } from '../services/reportService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { PriorityBadge } from '../components/StatusBadge';
import { priorityMeta, statusMeta, formatRole, toneFillClass } from '../lib/labels';
import { cn } from '../lib/utils';
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Tag,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Database,
  Layers,
  Zap,
  ClipboardList,
} from 'lucide-react';

const PERIOD_PRESETS = [
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'this_year', label: 'This year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const AI_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, title: 'Executive overview' },
  { id: 'keyFindings', label: 'Key findings', icon: Layers, title: 'Key findings and historical trends' },
  { id: 'insights', label: 'Insights', icon: Sparkles, title: 'Insights, trends and delivery risks' },
  { id: 'recommendations', label: 'Recommendations', icon: Zap, title: 'Recommendations' },
  { id: 'full', label: 'Full report', icon: FileText, title: null },
];

const signed = (n) => (Number(n) >= 0 ? `+${n ?? 0}` : `${n}`);

const Delta = ({ value }) => {
  const n = Number(value) || 0;
  const up = n >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn('tabular inline-flex items-center gap-0.5 font-medium', up ? 'text-success' : 'text-danger')}>
      <Icon className="h-3.5 w-3.5" />
      {signed(n)}%
    </span>
  );
};

const ComparisonBlock = ({ title, badge, currentLabel, current, priorLabel, prior, changeLabel, change, pct }) => (
  <div className="space-y-3 p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {badge}
    </div>
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{currentLabel}</dt>
        <dd className="tabular shrink-0 whitespace-nowrap font-medium">{current} tasks</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{priorLabel}</dt>
        <dd className="tabular shrink-0 whitespace-nowrap text-muted-foreground">{prior} tasks</dd>
      </div>
      <div className="flex justify-between gap-4 border-t pt-1.5">
        <dt className="text-muted-foreground">{changeLabel}</dt>
        <dd className={cn('tabular shrink-0 whitespace-nowrap font-medium', Number(change) >= 0 ? 'text-success' : 'text-danger')}>
          {signed(change)} ({signed(pct)}%)
        </dd>
      </div>
    </dl>
  </div>
);

const BreakdownBars = ({ items, metaFor, keyName }) => (
  <div className="space-y-4">
    {items.map((item) => {
      const meta = metaFor(item[keyName]);
      return (
        <div key={item[keyName]} className="space-y-1.5">
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
              className={cn('h-full rounded-full transition-all duration-500', toneFillClass[meta.tone])}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const Reports = () => {
  // Filter State
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Analytics Data State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  // AI Report State
  const [aiReport, setAiReport] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [activeAITab, setActiveAITab] = useState('overview');
  const [copiedReport, setCopiedReport] = useState(false);

  // Fetch Database Analytics
  const fetchAnalytics = async (period = selectedPeriod, start = customStartDate, end = customEndDate) => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const res = await reportService.getAnalytics({
        period,
        startDate: period === 'custom' ? start : undefined,
        endDate: period === 'custom' ? end : undefined,
      });

      if (res?.success && res?.data) {
        setAnalytics(res.data);
      } else {
        setAnalyticsError('Unable to load database reports.');
      }
    } catch (err) {
      console.error('Fetch Analytics Error:', err);
      setAnalyticsError(err.message || 'Error connecting to database reports.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
    // fetchAnalytics is intentionally excluded: it closes over the latest
    // custom date range and would otherwise re-run this effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // Handle Preset Change
  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    if (periodId !== 'custom') {
      fetchAnalytics(periodId);
    }
  };

  // Apply Custom Date Range
  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) return;
    fetchAnalytics('custom', customStartDate, customEndDate);
  };

  // Generate AI Executive Report
  const handleGenerateAIReport = async () => {
    setGeneratingAI(true);
    setAiError(null);
    try {
      const res = await reportService.generateAIReport({
        period: selectedPeriod,
        startDate: selectedPeriod === 'custom' ? customStartDate : undefined,
        endDate: selectedPeriod === 'custom' ? customEndDate : undefined,
      });

      if (res?.success && res?.data) {
        setAiReport(res.data);
        setActiveAITab('overview');
      } else {
        setAiError('Failed to generate AI insights.');
      }
    } catch (err) {
      console.error('Generate AI Report Error:', err);
      setAiError(err.message || 'Failed to generate AI report.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Copy Full Report
  const handleCopyReport = () => {
    if (!aiReport?.reportContent) return;
    navigator.clipboard.writeText(aiReport.reportContent);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const summary = analytics?.summary || {};
  const comparisons = analytics?.comparisons || {};
  const priorPeriod = comparisons?.priorPeriod || {};
  const sameMonthLastYear = comparisons?.sameMonthLastYear || {};
  const yearOverYear = comparisons?.yearOverYear || {};
  const overdueCount = summary.overdueCount || 0;
  const activeTab = AI_TABS.find((t) => t.id === activeAITab) || AI_TABS[0];
  const activeTabContent =
    activeAITab === 'full' ? aiReport?.reportContent : aiReport?.sections?.[activeAITab] || aiReport?.reportContent;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={
          analytics?.period?.label
            ? `Task analytics for ${analytics.period.label}.`
            : 'Task analytics, period comparisons and AI-generated summaries.'
        }
        actions={
          <>
            <Badge variant="neutral" className="h-8 px-2.5">
              <Database className="h-3.5 w-3.5" />
              {analytics?.scope || 'PostgreSQL'}
            </Badge>
            <Button
              onClick={handleGenerateAIReport}
              disabled={generatingAI || loadingAnalytics || (summary.totalTasks === 0)}
              size="sm"
            >
              {generatingAI ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generatingAI ? 'Generating...' : 'Generate AI report'}
            </Button>
          </>
        }
      />

      {/* Period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Reporting period" className="inline-flex w-fit flex-wrap rounded-md border bg-muted/60 p-0.5">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={selectedPeriod === p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={cn(
                'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors',
                selectedPeriod === p.id
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <form onSubmit={handleApplyCustomRange} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="startDate">From</label>
            <Input
              id="startDate"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              required
              className="h-8 w-40 text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <label className="sr-only" htmlFor="endDate">To</label>
            <Input
              id="endDate"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              required
              className="h-8 w-40 text-xs"
            />
            <Button type="submit" size="sm" variant="outline">Apply</Button>
          </form>
        )}
      </div>

      {/* AI report */}
      {(generatingAI || aiReport || aiError) && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">AI executive report</h2>
                <p className="text-xs text-muted-foreground">
                  {analytics?.period?.label || selectedPeriod}
                  {aiReport?.model && <> · {aiReport.model}</>}
                </p>
              </div>
            </div>

            {aiReport && !generatingAI && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyReport}>
                  {copiedReport ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedReport ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateAIReport} title="Regenerate">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>

          {generatingAI ? (
            <div className="flex flex-col items-center justify-center space-y-3 px-6 py-14 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <p className="text-sm font-medium">Analyzing task data...</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Comparing period volumes, year-over-year trends and contributor workload to identify risks.
              </p>
            </div>
          ) : aiError ? (
            <div className="m-5 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Unable to generate the AI report</p>
                <p className="mt-0.5 text-xs opacity-90">{aiError}</p>
              </div>
            </div>
          ) : aiReport ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b px-3">
                {AI_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeAITab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAITab(tab.id)}
                      className={cn(
                        '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
                        tab.id === 'full' && 'ml-auto',
                        active
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="px-5 py-5 sm:px-8 sm:py-6">
                {activeTab.title && (
                  <h3 className="mb-3 text-base font-semibold tracking-tight">{activeTab.title}</h3>
                )}
                <div className="markdown max-w-4xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeTabContent || ''}</ReactMarkdown>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      )}

      {loadingAnalytics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCard key={i} label="Loading" loading />
          ))}
        </div>
      ) : analyticsError ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title={analyticsError}
            description="Check that the backend is running, then try again."
            action={<Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>Retry</Button>}
          />
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tracked tasks"
              value={summary.totalTasks || 0}
              icon={ClipboardList}
              tone="primary"
              footer={
                priorPeriod.total > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Delta value={priorPeriod.volumeGrowthPct} /> vs prior period ({priorPeriod.total})
                  </span>
                ) : 'In the selected period'
              }
            />
            <StatCard
              label="Completion rate"
              value={summary.completionRate || '0.0%'}
              icon={CheckCircle2}
              tone="success"
              footer={
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${summary.completionRateNum || 0}%` }} />
                  </div>
                  <span className="tabular">{summary.completedTasks || 0}/{summary.totalTasks || 0}</span>
                </div>
              }
            />
            <StatCard
              label="Active workload"
              value={summary.activeTasks || 0}
              icon={Clock}
              tone="info"
              footer={`${summary.inProgressTasks || 0} in progress · ${summary.pendingTasks || 0} pending`}
            />
            <StatCard
              label="Overdue"
              value={overdueCount}
              icon={AlertTriangle}
              tone={overdueCount > 0 ? 'danger' : 'neutral'}
              footer={overdueCount > 0 ? <span className="text-danger">Needs immediate attention</span> : 'All tasks within deadline'}
            />
          </div>

          {/* Period comparisons */}
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle>Period comparisons</CardTitle>
              <CardDescription>Growth against the previous period and the same period last year</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
              <ComparisonBlock
                title="Period vs prior"
                badge={<Delta value={priorPeriod.volumeGrowthPct} />}
                currentLabel="Current period"
                current={summary.totalTasks || 0}
                priorLabel={priorPeriod.label || 'Prior period'}
                prior={priorPeriod.total || 0}
                changeLabel="Volume change"
                change={priorPeriod.volumeChange || 0}
                pct={priorPeriod.volumeGrowthPct || 0}
              />
              <ComparisonBlock
                title="Year over year"
                badge={<Delta value={sameMonthLastYear.volumeGrowthPct} />}
                currentLabel="Current month"
                current={summary.totalTasks || 0}
                priorLabel={sameMonthLastYear.label || 'Same month last year'}
                prior={sameMonthLastYear.total || 0}
                changeLabel="Net change"
                change={sameMonthLastYear.volumeChange || 0}
                pct={sameMonthLastYear.volumeGrowthPct || 0}
              />
              <ComparisonBlock
                title="Annual trajectory"
                badge={<Delta value={yearOverYear.volumeGrowthPct} />}
                currentLabel="This year"
                current={yearOverYear.currentTotal || 0}
                priorLabel="Last year"
                prior={yearOverYear.prevTotal || 0}
                changeLabel="Annual change"
                change={yearOverYear.volumeChange || 0}
                pct={yearOverYear.volumeGrowthPct || 0}
              />
            </div>
          </Card>

          {/* Status & priority */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="border-b py-4">
                <CardTitle>Status breakdown</CardTitle>
                <CardDescription>Share of tasks in each lifecycle stage</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <BreakdownBars items={analytics.statusBreakdown || []} metaFor={statusMeta} keyName="status" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="border-b py-4">
                <CardTitle>Priority distribution</CardTitle>
                <CardDescription>Workload split by urgency</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <BreakdownBars items={analytics.priorityBreakdown || []} metaFor={priorityMeta} keyName="priority" />
              </CardContent>
            </Card>
          </div>

          {/* Workload */}
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
              <div className="space-y-1">
                <CardTitle>Team workload</CardTitle>
                <CardDescription>Allocation, completion and overdue items per contributor</CardDescription>
              </div>
              <Badge variant="neutral">{analytics.workloadBreakdown?.length || 0} members</Badge>
            </CardHeader>
            {analytics.workloadBreakdown?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Team member</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">In progress</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="min-w-[160px]">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.workloadBreakdown.map((w) => (
                    <TableRow key={w.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {w.name.charAt(0)}
                          </span>
                          <div>
                            <p className="font-medium">{w.name}</p>
                            <p className="text-xs text-muted-foreground">{formatRole(w.role)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular text-right font-medium">{w.total}</TableCell>
                      <TableCell className="tabular text-right">{w.completed}</TableCell>
                      <TableCell className="tabular text-right">{w.inProgress}</TableCell>
                      <TableCell className="tabular text-right">{w.pending}</TableCell>
                      <TableCell className="tabular text-right">
                        {w.overdue > 0 ? <Badge variant="danger">{w.overdue}</Badge> : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-success" style={{ width: `${w.completionRate}%` }} />
                          </div>
                          <span className="tabular w-10 text-right text-xs font-medium">{w.completionRate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Users} title="No workload records" description="No tasks are assigned in this period." />
            )}
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle>Categories</CardTitle>
              <CardDescription>Progress by task tag</CardDescription>
            </CardHeader>
            {analytics.tagBreakdown?.length > 0 ? (
              <CardContent className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                {analytics.tagBreakdown.map((t) => (
                  <div key={t.tag} className="space-y-2.5 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{t.tag}</span>
                      </span>
                      <span className="tabular text-xs text-muted-foreground">{t.total}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.completionRate}%` }} />
                    </div>
                    <div className="tabular flex justify-between text-[11px] text-muted-foreground">
                      <span>{t.completed} done · {t.completionRate}%</span>
                      <span>{t.inProgress + t.pending} active</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            ) : (
              <EmptyState icon={Tag} title="No categories recorded" />
            )}
          </Card>

          {/* Overdue */}
          {analytics.overdueTasks?.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center gap-3 space-y-0 border-b py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-danger/10 text-danger">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Overdue deliverables</CardTitle>
                  <CardDescription>{analytics.overdueTasks.length} tasks past their due date</CardDescription>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Due date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.overdueTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="text-muted-foreground">{t.assignee}</TableCell>
                      <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                      <TableCell className="tabular text-right font-medium text-danger">{t.dueDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
