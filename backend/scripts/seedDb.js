/**
 * Realistic Multi-Period Historical Dummy Data Seeder
 *
 * Generates a large, realistic dataset relative to whenever this script is
 * actually run (not hard-coded calendar dates), so the required historical
 * buckets are always correct:
 *   - Last Year        (trailing ~13 months)
 *   - Last 6 Months
 *   - Last 3 Months
 *   - Last Month
 *   - This Month
 *   - This Week
 *   - Today
 *
 * Produces ~350-450 tasks across the existing 6 demo users/1 tenant, with
 * status/priority distributions that skew realistically by task age (older
 * tasks mostly resolved, recent tasks mostly active), so overdue items,
 * upcoming deadlines, and completion trends all show up naturally in the
 * Reports/AI Insights and the Synthie AI Chatbot.
 */

const { sequelize, Tenant, User, Task } = require('../src/models');

// ---------------------------------------------------------------------------
// Small deterministic-ish RNG helpers
// ---------------------------------------------------------------------------
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const pickWeighted = (items) => {
  // items: [{ value, weight }]
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item.value;
    r -= item.weight;
  }
  return items[items.length - 1].value;
};
const randBetween = (minMs, maxMs) => new Date(minMs + Math.random() * Math.max(0, maxMs - minMs));

// ---------------------------------------------------------------------------
// Category pools (drives tags, titles, descriptions, preferred assignee)
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    tags: ['Engineering', 'Backend'],
    preferred: 'dev',
    titles: [
      'API Endpoint Refactor for {m} Release', 'Backend Performance Tuning Sprint',
      'Node.js Dependency Upgrade & Audit', 'Sequelize Query Optimization Pass',
      'Rate Limiting Middleware Implementation', 'Background Job Queue Reliability Fix',
      'REST API Versioning Rollout', 'Server Error Logging Pipeline Improvement'
    ],
    descs: [
      'Improve backend reliability, performance, and maintainability.',
      'Address technical debt identified during the last engineering review.',
      'Coordinate with QA to validate backend changes before release.'
    ]
  },
  {
    tags: ['Frontend', 'UI/UX'],
    preferred: 'design',
    titles: [
      'Dashboard Layout Polish for {m}', 'Responsive Mobile Breakpoint Fixes',
      'Component Library Consistency Pass', 'Dark Mode Contrast Adjustments',
      'Form Validation UX Improvements', 'Loading State & Skeleton Screens',
      'Navigation Menu Redesign', 'Accessibility (WCAG) Touch-Up'
    ],
    descs: [
      'Refine the user interface based on recent usability feedback.',
      'Ensure consistent design language across all core screens.',
      'Improve accessibility and responsiveness across breakpoints.'
    ]
  },
  {
    tags: ['Quality Assurance', 'Testing'],
    preferred: 'qa',
    titles: [
      '{m} Regression Test Pass', 'Automated Test Coverage Expansion',
      'Cross-Browser Compatibility Sweep', 'API Contract Test Suite Update',
      'Bug Triage & Reproduction Session', 'Smoke Test Suite Maintenance',
      'Load & Stress Testing Round', 'End-to-End Test Flakiness Cleanup'
    ],
    descs: [
      'Verify recent changes do not introduce regressions.',
      'Expand automated coverage on newly shipped features.',
      'Track down and document reproducible defects for engineering.'
    ]
  },
  {
    tags: ['DevOps', 'Infrastructure'],
    preferred: 'ops',
    titles: [
      '{m} Infrastructure Cost Review', 'CI/CD Pipeline Reliability Fix',
      'Database Backup Verification Drill', 'Staging Environment Refresh',
      'SSL Certificate Renewal & Rotation', 'Server Capacity Planning',
      'Container Image Hardening Pass', 'Uptime & Alerting Review'
    ],
    descs: [
      'Keep deployment and infrastructure tooling healthy and cost-efficient.',
      'Reduce operational risk ahead of the next release window.',
      'Validate recovery procedures and monitoring coverage.'
    ]
  },
  {
    tags: ['Security', 'Compliance', 'Audit'],
    preferred: 'ops',
    titles: [
      '{m} Access Control Audit', 'Dependency Vulnerability Scan',
      'Multi-Tenant Data Isolation Check', 'Password Policy Compliance Review',
      'Audit Log Retention Verification', 'Third-Party Vendor Security Review',
      'Role Permission Matrix Cleanup', 'Incident Response Runbook Update'
    ],
    descs: [
      'Confirm security controls remain effective and compliant.',
      'Review access and audit trails for anomalies.',
      'Close out findings from the previous compliance review.'
    ]
  },
  {
    tags: ['Finance', 'Operations'],
    preferred: 'admin',
    titles: [
      '{m} Expense Reconciliation', 'Vendor Invoice Review',
      'Subscription Billing Audit', 'Budget Variance Analysis',
      'Cost Center Reporting Cleanup', 'Quarterly SLA Compliance Check',
      'Payroll Processing Verification', 'Procurement Approval Backlog'
    ],
    descs: [
      'Reconcile financial records against operational activity.',
      'Confirm vendor and subscription costs remain within budget.',
      'Prepare finance summaries for leadership review.'
    ]
  },
  {
    tags: ['Marketing', 'Design'],
    preferred: 'design',
    titles: [
      '{m} Campaign Landing Page', 'Social Media Content Calendar',
      'Customer Case Study Draft', 'Product One-Pager Refresh',
      'Email Newsletter Template Update', 'Brand Guidelines Touch-Up',
      'Webinar Promotional Assets', 'Customer Feedback Synthesis'
    ],
    descs: [
      'Support upcoming marketing initiatives with fresh creative assets.',
      'Summarize customer feedback into actionable marketing insights.',
      'Prepare promotional materials ahead of the campaign launch.'
    ]
  },
  {
    tags: ['Database', 'Engineering'],
    preferred: 'dev',
    titles: [
      '{m} Index & Query Plan Review', 'Schema Migration Dry Run',
      'Connection Pool Tuning', 'Slow Query Investigation',
      'Data Retention Policy Cleanup Job', 'Read Replica Lag Investigation'
    ],
    descs: [
      'Keep database performance and integrity within target thresholds.',
      'Validate schema changes are safe to apply in production.',
      'Investigate and resolve query performance regressions.'
    ]
  },
  {
    tags: ['AI Integration', 'Engineering'],
    preferred: 'dev',
    titles: [
      'AI Chat Grounding Accuracy Review', 'Model Provider Failover Testing',
      'Prompt Template Refinement', 'AI Response Latency Optimization',
      'Synthie AI Insight Quality Review', 'Streaming Token Reliability Fix'
    ],
    descs: [
      'Improve the accuracy and reliability of AI-generated responses.',
      'Validate AI provider fallback behavior under failure conditions.',
      'Tune prompts and grounding data for higher answer quality.'
    ]
  },
  {
    tags: ['Operations', 'Management'],
    preferred: 'admin',
    titles: [
      '{m} Sprint Retrospective', 'Team Capacity Planning Review',
      'Weekly Stakeholder Status Update', 'Onboarding Checklist Refresh',
      'Cross-Team Dependency Review', 'Executive Summary Preparation'
    ],
    descs: [
      'Align the team on priorities and delivery pace.',
      'Review workload distribution and upcoming milestones.',
      'Prepare status materials for stakeholder visibility.'
    ]
  }
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const applyTitleTemplate = (template, date) => template.replace('{m}', `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`);

/**
 * Status distribution shifts realistically as tasks age:
 * older tasks are almost all resolved, brand-new tasks are almost all
 * still pending/in_progress.
 */
function pickStatusByAge(ageDays) {
  if (ageDays > 45) {
    return pickWeighted([
      { value: 'completed', weight: 80 },
      { value: 'cancelled', weight: 9 },
      { value: 'in_progress', weight: 6 },
      { value: 'pending', weight: 5 }
    ]);
  }
  if (ageDays > 14) {
    return pickWeighted([
      { value: 'completed', weight: 55 },
      { value: 'cancelled', weight: 10 },
      { value: 'in_progress', weight: 20 },
      { value: 'pending', weight: 15 }
    ]);
  }
  if (ageDays > 3) {
    return pickWeighted([
      { value: 'completed', weight: 28 },
      { value: 'cancelled', weight: 5 },
      { value: 'in_progress', weight: 35 },
      { value: 'pending', weight: 32 }
    ]);
  }
  return pickWeighted([
    { value: 'completed', weight: 6 },
    { value: 'cancelled', weight: 2 },
    { value: 'in_progress', weight: 27 },
    { value: 'pending', weight: 65 }
  ]);
}

function pickPriority() {
  return pickWeighted([
    { value: 'low', weight: 20 },
    { value: 'medium', weight: 35 },
    { value: 'high', weight: 30 },
    { value: 'urgent', weight: 15 }
  ]);
}

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive multi-period historical database seed...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    const now = new Date();

    // 1. Create or Find Demo Tenant
    const [demoTenant] = await Tenant.findOrCreate({
      where: { name: 'Demo Tenant' },
      defaults: {
        companyName: 'Apex Global Enterprises',
        email: 'contact@apexglobal.com',
        phone: '+1 (555) 234-5678',
        address: '850 Technology Park, Suite 400, San Francisco, CA',
        subscriptionPlan: 'enterprise',
        isActive: true,
        settings: { theme: 'system', notificationsEnabled: true }
      }
    });

    console.log(`✅ Tenant ready: ${demoTenant.companyName} (${demoTenant.id})`);

    // 2. Create Users with realistic roles (unchanged identities)
    const usersData = [
      { username: 'superadmin', email: 'superadmin@system.com', firstName: 'Super', lastName: 'Admin', role: 'super_admin', isActive: true, tenantId: demoTenant.id },
      { username: 'keisha_admin', email: 'keisha@apexglobal.com', firstName: 'Keisha', lastName: 'Delgado', role: 'admin', isActive: true, tenantId: demoTenant.id },
      { username: 'vincent_dev', email: 'vincent.cabatas@apexglobal.com', firstName: 'Vincent', lastName: 'Cabatas', role: 'staff', isActive: true, tenantId: demoTenant.id },
      { username: 'brownie_qa', email: 'brownie.delgado@apexglobal.com', firstName: 'Brownie', lastName: 'Delgado', role: 'staff', isActive: true, tenantId: demoTenant.id },
      { username: 'brailey_ops', email: 'brailey.delgado@apexglobal.com', firstName: 'Brailey', lastName: 'Delgado', role: 'staff', isActive: true, tenantId: demoTenant.id },
      { username: 'pochie_design', email: 'pochie.delgado@apexglobal.com', firstName: 'Pochie', lastName: 'Delgado', role: 'staff', isActive: true, tenantId: demoTenant.id }
    ];

    const userMap = {};
    for (const u of usersData) {
      let [userObj] = await User.findOrCreate({ where: { username: u.username }, defaults: u });
      userMap[u.username] = userObj;
    }

    const allUsers = await User.findAll({ where: { tenantId: demoTenant.id } });
    const primaryAdmin = userMap['keisha_admin'] || userMap['superadmin'];
    const roleToUser = {
      dev: userMap['vincent_dev']?.id || primaryAdmin.id,
      qa: userMap['brownie_qa']?.id || primaryAdmin.id,
      ops: userMap['brailey_ops']?.id || primaryAdmin.id,
      design: userMap['pochie_design']?.id || primaryAdmin.id,
      admin: primaryAdmin.id
    };
    const staffPool = ['dev', 'qa', 'ops', 'design'];

    function pickAssignee(preferred) {
      // 75% of the time goes to the category's natural owner, 25% spreads
      // across the rest of the team (realistic cross-functional overlap).
      if (Math.random() < 0.75) return roleToUser[preferred];
      return roleToUser[pick(staffPool)];
    }

    // 3. Clear existing tasks for a clean, reproducible dataset
    await Task.destroy({ where: { tenantId: demoTenant.id } });
    console.log('🧹 Cleared existing task records for demo tenant');

    const tasksToInsert = [];

    // 4. Generate tasks across the trailing 13 calendar months (relative to "now")
    //    with a growth curve so recent months carry more volume than older ones.
    for (let monthsAgo = 12; monthsAgo >= 0; monthsAgo--) {
      const monthAnchor = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const year = monthAnchor.getFullYear();
      const month = monthAnchor.getMonth();
      const isCurrentMonth = monthsAgo === 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const maxDay = isCurrentMonth ? now.getDate() : daysInMonth;
      const count = Math.round(18 + (12 - monthsAgo) * 1.8);

      for (let i = 0; i < count; i++) {
        let day;
        if (isCurrentMonth && Math.random() < 0.4) {
          // Bias a portion of the current month's tasks into "this week"
          day = Math.max(1, maxDay - randInt(0, 6));
          if (Math.random() < 0.3) day = maxDay; // "today"
        } else {
          day = randInt(1, maxDay);
        }

        const hour = randInt(8, 18);
        const createdAt = new Date(Date.UTC(year, month, day, hour, randInt(0, 59), 0));
        if (createdAt > now) createdAt.setTime(now.getTime() - randInt(0, 3) * 3600000);

        const ageDays = (now.getTime() - createdAt.getTime()) / 86400000;
        const status = pickStatusByAge(ageDays);
        const priority = pickPriority();
        const category = pick(CATEGORIES);
        const assignedTo = pickAssignee(category.preferred);
        const createdBy = Math.random() < 0.85 ? roleToUser.admin : assignedTo;
        const titleTemplate = pick(category.titles);
        const title = applyTitleTemplate(titleTemplate, createdAt);
        const description = pick(category.descs);

        const dueDate = new Date(createdAt.getTime() + randInt(3, 20) * 86400000);

        let completedAt = null;
        if (status === 'completed') {
          const earliest = createdAt.getTime() + 12 * 3600000;
          let latest = Math.min(dueDate.getTime() + 3 * 86400000, now.getTime());
          if (latest < earliest) latest = Math.min(earliest + 6 * 3600000, now.getTime());
          completedAt = randBetween(earliest, latest);
        }

        tasksToInsert.push({
          title,
          description,
          status,
          priority,
          tags: category.tags,
          assignedTo,
          createdBy,
          tenantId: demoTenant.id,
          createdAt,
          updatedAt: completedAt || createdAt,
          dueDate,
          completedAt
        });
      }
    }

    // 5. Guaranteed scenario tasks so specific chatbot questions always have
    //    a clear, non-empty answer regardless of random distribution above.
    const guaranteed = [
      // Due today
      { title: 'Client Demo Environment Final Check', status: 'pending', priority: 'high', tags: ['Operations'], role: 'ops', createdDaysAgo: 3, dueDaysFromNow: 0 },
      { title: 'Daily Standup Action Items Follow-up', status: 'in_progress', priority: 'medium', tags: ['Management'], role: 'admin', createdDaysAgo: 2, dueDaysFromNow: 0 },
      { title: 'Production Hotfix Verification', status: 'pending', priority: 'urgent', tags: ['Engineering', 'Backend'], role: 'dev', createdDaysAgo: 1, dueDaysFromNow: 0 },
      // Overdue
      { title: 'SOC2 Evidence Package Submission', status: 'pending', priority: 'urgent', tags: ['Compliance', 'Security'], role: 'ops', createdDaysAgo: 20, dueDaysFromNow: -5 },
      { title: 'Legacy API Client Migration', status: 'in_progress', priority: 'high', tags: ['Engineering'], role: 'dev', createdDaysAgo: 25, dueDaysFromNow: -3 },
      { title: 'Vendor Contract Renewal Sign-off', status: 'pending', priority: 'high', tags: ['Finance', 'Operations'], role: 'admin', createdDaysAgo: 18, dueDaysFromNow: -2 },
      { title: 'Broken Password Reset Email Template', status: 'pending', priority: 'medium', tags: ['Frontend', 'Bugs'], role: 'qa', createdDaysAgo: 15, dueDaysFromNow: -4 },
      // Due this week (upcoming)
      { title: 'Weekly Sprint Demo Preparation', status: 'in_progress', priority: 'medium', tags: ['Management'], role: 'admin', createdDaysAgo: 3, dueDaysFromNow: 3 },
      { title: 'Design Review for New Onboarding Flow', status: 'pending', priority: 'medium', tags: ['UI/UX', 'Design'], role: 'design', createdDaysAgo: 2, dueDaysFromNow: 4 },
      { title: 'QA Sign-off on Release Candidate', status: 'pending', priority: 'high', tags: ['Quality Assurance'], role: 'qa', createdDaysAgo: 1, dueDaysFromNow: 5 },
      // Completed today / this week
      { title: 'Morning Database Health Check', status: 'completed', priority: 'low', tags: ['Database', 'DevOps'], role: 'dev', createdDaysAgo: 1, dueDaysFromNow: 0, completedDaysAgo: 0 },
      { title: 'Weekly Analytics Digest Email', status: 'completed', priority: 'low', tags: ['Analytics', 'Operations'], role: 'admin', createdDaysAgo: 4, dueDaysFromNow: -1, completedDaysAgo: 1 },
      { title: 'Customer Support Ticket Backlog Triage', status: 'completed', priority: 'medium', tags: ['Support', 'Operations'], role: 'ops', createdDaysAgo: 5, dueDaysFromNow: -2, completedDaysAgo: 2 }
    ];

    for (const g of guaranteed) {
      const createdAt = new Date(now.getTime() - g.createdDaysAgo * 86400000);
      const dueDate = new Date(now.getTime() + g.dueDaysFromNow * 86400000);
      const completedAt = g.status === 'completed'
        ? new Date(now.getTime() - (g.completedDaysAgo || 0) * 86400000)
        : null;
      const assignedTo = roleToUser[g.role];

      tasksToInsert.push({
        title: g.title,
        description: `Priority follow-up tracked for ${g.tags[0].toLowerCase()} workstream.`,
        status: g.status,
        priority: g.priority,
        tags: g.tags,
        assignedTo,
        createdBy: roleToUser.admin,
        tenantId: demoTenant.id,
        createdAt,
        updatedAt: completedAt || createdAt,
        dueDate,
        completedAt
      });
    }

    console.log(`📝 Inserting ${tasksToInsert.length} multi-period historical tasks into PostgreSQL...`);
    await Task.bulkCreate(tasksToInsert, { validate: true });

    // 6. Summary
    const totalCount = await Task.count({ where: { tenantId: demoTenant.id } });
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfThisWeek = new Date(now.getTime() - 7 * 86400000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastYear = new Date(now.getTime() - 365 * 86400000);

    const { Op } = sequelize.Sequelize;
    const countLastYear = await Task.count({ where: { tenantId: demoTenant.id, createdAt: { [Op.gte]: startOfLastYear } } });
    const countThisMonth = await Task.count({ where: { tenantId: demoTenant.id, createdAt: { [Op.gte]: startOfThisMonth } } });
    const countThisWeek = await Task.count({ where: { tenantId: demoTenant.id, createdAt: { [Op.gte]: startOfThisWeek } } });
    const countToday = await Task.count({ where: { tenantId: demoTenant.id, createdAt: { [Op.gte]: startOfToday } } });
    const countOverdue = await Task.count({
      where: {
        tenantId: demoTenant.id,
        status: { [Op.notIn]: ['completed', 'cancelled'] },
        dueDate: { [Op.lt]: now }
      }
    });

    console.log('\n======================================================');
    console.log('🎉 MULTI-PERIOD HISTORICAL SEEDING COMPLETED!');
    console.log('======================================================');
    console.log(`🏢 Tenant: ${demoTenant.companyName}`);
    console.log(`👥 Active Users: ${allUsers.length}`);
    console.log(`📋 Total Tasks: ${totalCount}`);
    console.log(`   - 📅 Trailing 12 Months: ${countLastYear} tasks`);
    console.log(`   - 🚀 This Month:         ${countThisMonth} tasks`);
    console.log(`   - 📈 This Week:          ${countThisWeek} tasks`);
    console.log(`   - ☀️  Today:              ${countToday} tasks`);
    console.log(`   - ⚠️  Currently Overdue:  ${countOverdue} tasks`);
    console.log('======================================================\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database seeding failed:');
    console.error(error);

    await sequelize.close();
    process.exit(1);
  }
};

seedDatabase();
