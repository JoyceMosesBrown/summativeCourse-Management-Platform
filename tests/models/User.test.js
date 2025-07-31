const { User } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
      password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
      password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      const user = await User.create(userData);
      const isPasswordValid = await user.comparePassword('TestPassword123!');

      expect(isPasswordValid).toBe(true);
      expect(user.password).not.toBe(userData.password);
    });

    it('should not include password in JSON output', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.email).toBe(userData.email);
    });
  });

  describe('User Validation', () => {
    it('should require email', async () => {
      const userData = {
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require valid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require valid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'invalid-role'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require minimum password length', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'StrongPass!456',
        firstName: 'peter',
        lastName: 'chol',
        role: 'student'
      });
    });

    it('should compare password correctly', async () => {
      const isValid = await user.comparePassword('TestPassword123!');
      const isInvalid = await user.comparePassword('WrongPassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should update password and hash it', async () => {
      const newPassword = 'NewPassword123!';
      await user.update({ password: newPassword });

      const isOldPasswordValid = await user.comparePassword('TestPassword123!');
      const isNewPasswordValid = await user.comparePassword(newPassword);

      expect(isOldPasswordValid).toBe(false);
      expect(isNewPasswordValid).toBe(true);
    });
  });
});