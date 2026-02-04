const { requireAdmin } = require('../src/middleware/auth');

describe('Admin Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        process.env.ADMIN_EMAILS = 'admin@example.com';

        mockReq = {
            user: null,
            isAuthenticated: jest.fn()
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return 401 if user is not authenticated', () => {
        mockReq.isAuthenticated.mockReturnValue(false);

        const { requireAdmin } = require('../src/middleware/auth');
        requireAdmin(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is authenticated but not an admin', () => {
        mockReq.isAuthenticated.mockReturnValue(true);
        mockReq.user = { id: 1, email: 'user@example.com' };

        const { requireAdmin } = require('../src/middleware/auth');
        requireAdmin(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if user is an admin', () => {
        mockReq.isAuthenticated.mockReturnValue(true);
        mockReq.user = { id: 1, email: 'admin@example.com' };

        const { requireAdmin } = require('../src/middleware/auth');
        requireAdmin(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should be case-insensitive for admin email check', () => {
        mockReq.isAuthenticated.mockReturnValue(true);
        mockReq.user = { id: 1, email: 'ADMIN@EXAMPLE.COM' };

        const { requireAdmin } = require('../src/middleware/auth');
        requireAdmin(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
    });
});
