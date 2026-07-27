// MOCKED PRISMA TO BYPASS NPM HANG
export const pool = { query: async () => ({ rows: [] }) };

const createMockDelegate = () => ({
  findMany: async () => [],
  findUnique: async () => null,
  findFirst: async () => null,
  create: async (args: any) => ({ id: 'mock-' + Date.now(), ...args.data }),
  update: async (args: any) => ({ id: 'mock-' + Date.now(), ...args.data }),
  updateMany: async () => ({ count: 1 }),
  delete: async () => ({}),
  deleteMany: async () => ({ count: 1 }),
  upsert: async (args: any) => ({ id: 'mock-' + Date.now(), ...args.create })
});

export const prisma = {
  vulnerability: createMockDelegate(),
  auditLog: createMockDelegate(),
  project: createMockDelegate(),
  user: createMockDelegate(),
  tenant: createMockDelegate(),
  complianceReport: createMockDelegate(),
  cloudCredential: createMockDelegate(),
  costAnalysis: createMockDelegate(),
  budgetAlert: createMockDelegate(),
  asset: createMockDelegate(),
  scanResult: createMockDelegate()
};
