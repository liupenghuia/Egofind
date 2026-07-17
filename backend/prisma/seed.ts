import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { code: 'user:read', name: '查看用户', resource: 'user', action: 'read' },
    { code: 'user:write', name: '管理用户', resource: 'user', action: 'write' },
    { code: 'trip:read', name: '查看行程', resource: 'trip', action: 'read' },
    { code: 'trip:write', name: '管理行程', resource: 'trip', action: 'write' },
    { code: 'match:write', name: '确认匹配', resource: 'match', action: 'write' },
    { code: 'admin:all', name: '后台管理', resource: 'admin', action: 'all' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, resource: p.resource, action: p.action },
      create: p,
    });
  }

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: { name: '普通用户' },
    create: { code: 'user', name: '普通用户' },
  });

  const driverRole = await prisma.role.upsert({
    where: { code: 'driver' },
    update: { name: '司机' },
    create: { code: 'driver', name: '司机' },
  });

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: { name: '管理员' },
    create: { code: 'admin', name: '管理员' },
  });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const tripWrite = allPerms.find((p) => p.code === 'trip:write');
  if (tripWrite) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: driverRole.id, permissionId: tripWrite.id },
      },
      update: {},
      create: { roleId: driverRole.id, permissionId: tripWrite.id },
    });
  }

  const readPerm = allPerms.find((p) => p.code === 'user:read');
  if (readPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: userRole.id, permissionId: readPerm.id },
      },
      update: {},
      create: { roleId: userRole.id, permissionId: readPerm.id },
    });
  }

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      nickname: '系统管理员',
      status: 1,
    },
    create: {
      username: 'admin',
      passwordHash,
      nickname: '系统管理员',
      status: 1,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('Seed OK: admin / Admin123!; roles user/driver/admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
