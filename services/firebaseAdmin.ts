// In production, this would import from 'firebase-admin/app' and 'firebase-admin/auth'
// For local bypassing due to NPM lockups, we export a mock.

export const adminApp = {};
export const adminAuth = {
  verifyIdToken: async (token: string) => {
    console.log("Mock verifying token:", token);
    return {
      uid: "mock-admin-uid-123",
      email: "admin@cloudguardian.io",
      name: "Admin User",
    };
  }
};
