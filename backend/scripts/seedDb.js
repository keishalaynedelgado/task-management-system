const { sequelize, Tenant, User } = require('../src/models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create demo tenant
    const tenant = await Tenant.findOrCreate({
      where: {
        name: 'Demo Tenant'
      },
      defaults: {
        companyName: 'Demo Company',
        email: 'demo@company.com',
        phone: '09123456789',
        address: 'Cagayan de Oro City',
        subscriptionPlan: 'basic',
        isActive: true
      }
    });

    const demoTenant = tenant[0];

    console.log(`✅ Tenant ready: ${demoTenant.name}`);

    // Create super admin
    const [superAdmin] = await User.findOrCreate({
      where: {
        username: 'superadmin'
      },
      defaults: {
        email: 'superadmin@system.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
        tenantId: demoTenant.id
      }
    });

    console.log(`✅ User ready: ${superAdmin.username}`);

    // Create admin
    const [admin] = await User.findOrCreate({
      where: {
        username: 'admin1'
      },
      defaults: {
        email: 'admin@company.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        tenantId: demoTenant.id
      }
    });

    console.log(`✅ User ready: ${admin.username}`);

    // Create staff
    const [staff] = await User.findOrCreate({
      where: {
        username: 'staff1'
      },
      defaults: {
        email: 'staff@company.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'staff',
        isActive: true,
        tenantId: demoTenant.id
      }
    });

    console.log(`✅ User ready: ${staff.username}`);

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Created:');
    console.log('- Tenant: Demo Tenant');
    console.log('- User: superadmin');
    console.log('- User: admin1');
    console.log('- User: staff1');

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