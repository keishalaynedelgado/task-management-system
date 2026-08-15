const { sequelize, Tenant, User, Task } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  try {
    await sequelize.sync({ force: true });
    
    console.log('🌱 Seeding database...');
    
    // Create a default tenant
    const tenant = await Tenant.create({
      id: uuidv4(),
      name: 'demo-company',
      companyName: 'Demo Company Inc.',
      email: 'demo@company.com',
      phone: '+1234567890',
      subscriptionPlan: 'premium',
      isActive: true
    });
    
    console.log('✅ Created tenant:', tenant.name);
    
    // Create Super Admin
    const superAdmin = await User.create({
      id: uuidv4(),
      username: 'superadmin',
      email: 'superadmin@system.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('✅ Created super admin:', superAdmin.username);
    
    // Create Admin
    const admin = await User.create({
      id: uuidv4(),
      username: 'admin1',
      email: 'admin@company.com',
      firstName: 'Company',
      lastName: 'Admin',
      role: 'admin',
      tenantId: tenant.id,
      isActive: true
    });
    
    console.log('✅ Created admin:', admin.username);
    
    // Create Staff
    const staff = await User.create({
      id: uuidv4(),
      username: 'staff1',
      email: 'staff@company.com',
      firstName: 'Staff',
      lastName: 'User',
      role: 'staff',
      tenantId: tenant.id,
      isActive: true
    });
    
    console.log('✅ Created staff:', staff.username);
    
    // Create a task
    const task = await Task.create({
      id: uuidv4(),
      title: 'Welcome Task',
      description: 'This is a sample task to get you started',
      status: 'pending',
      priority: 'medium',
      assignedTo: staff.id,
      createdBy: admin.id,
      tenantId: tenant.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      tags: ['welcome', 'sample']
    });
    
    console.log('✅ Created task:', task.title);
    
    console.log('🎉 Database seeding completed!');
    console.log('\n📝 Test Credentials:');
    console.log('Super Admin: superadmin / any password');
    console.log('Admin: admin1 / any password');
    console.log('Staff: staff1 / any password');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();