const { CourseOffering, Module, Facilitator, Cohort, Class, Mode, User } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

describe('CourseOffering Model', () => {
  let module, facilitator, cohort, classEntity, mode, user;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    user = await User.create({
      email: 'dr.adams@university.edu',
      password: 'StrongPass!456',
      firstName: 'Joyce',
      lastName: 'Moses',
      role: 'facilitator'
    });

    facilitator = await Facilitator.create({
      userId: user.id,
      employeeId: 'FAC987',
      specialization: 'Systems Engineering'
    });

    module = await Module.create({
      code: 'CS450',
      name: 'Advanced Systems Programming',
      description: 'Low-level systems programming with C and OS principles',
      credits: 8,
      level: 'postgraduate'
    });

    cohort = await Cohort.create({
      name: 'MSc SE 2025',
      year: 2025,
      program: 'Software Engineering',
      intakePeriod: 'HT2'
    });

    classEntity = await Class.create({
      code: '2025A',
      year: 2025,
      semester: 'A',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-06-15')
    });

    mode = await Mode.create({
      name: 'hybrid',
      description: 'Combination of online and face-to-face delivery'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await CourseOffering.destroy({ where: {}, force: true });
  });

  describe('CourseOffering Creation', () => {
    it('should create a course offering with valid data', async () => {
      const offeringData = {
        moduleId: module.id,
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'T1',
        maxEnrollment: 20,
        location: 'Tech Hall B'
      };

      const offering = await CourseOffering.create(offeringData);

      expect(offering.id).toBeDefined();
      expect(offering.moduleId).toBe(offeringData.moduleId);
      expect(offering.facilitatorId).toBe(offeringData.facilitatorId);
      expect(offering.trimester).toBe('T1');
      expect(offering.currentEnrollment).toBe(0);
      expect(offering.isActive).toBe(true);
    });

    it('should enforce unique constraint on module, cohort, class, and trimester', async () => {
      const data = {
        moduleId: module.id,
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'T1'
      };
      await CourseOffering.create(data);
      await expect(CourseOffering.create(data)).rejects.toThrow();
    });

    it('should include associations when queried', async () => {
      const data = {
        moduleId: module.id,
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'T2'
      };

      const offering = await CourseOffering.create(data);
      const full = await CourseOffering.findByPk(offering.id, {
        include: [
          { model: Module, as: 'module' },
          { model: Facilitator, as: 'facilitator' },
          { model: Cohort, as: 'cohort' },
          { model: Class, as: 'class' },
          { model: Mode, as: 'mode' }
        ]
      });

      expect(full.module.code).toBe('CS450');
      expect(full.facilitator.employeeId).toBe('FAC987');
      expect(full.cohort.name).toBe('MSc SE 2025');
      expect(full.class.code).toBe('2025A');
      expect(full.mode.name).toBe('hybrid');
    });
  });

  describe('CourseOffering Validation', () => {
    it('should require all mandatory fields', async () => {
      await expect(CourseOffering.create({
        moduleId: module.id,
        facilitatorId: facilitator.id
        // other fields missing
      })).rejects.toThrow();
    });

    it('should validate trimester values', async () => {
      await expect(CourseOffering.create({
        moduleId: module.id,
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'WRONG'
      })).rejects.toThrow();
    });

    it('should reject invalid foreign keys', async () => {
      await expect(CourseOffering.create({
        moduleId: 'bad-id',
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'T1'
      })).rejects.toThrow();
    });
  });

  describe('CourseOffering Updates', () => {
    let offering;

    beforeEach(async () => {
      offering = await CourseOffering.create({
        moduleId: module.id,
        facilitatorId: facilitator.id,
        cohortId: cohort.id,
        classId: classEntity.id,
        modeId: mode.id,
        trimester: 'T3',
        maxEnrollment: 30
      });
    });

    it('should update enrollment count', async () => {
      await offering.update({ currentEnrollment: 25 });
      expect(offering.currentEnrollment).toBe(25);
    });

    it('should update location and schedule', async () => {
      const schedule = {
        tuesday: { start: '10:00', end: '12:00' },
        thursday: { start: '13:00', end: '15:00' }
      };
      await offering.update({ location: 'Lab C2', schedule });
      expect(offering.location).toBe('Lab C2');
      expect(offering.schedule).toEqual(schedule);
    });

    it('should soft delete by disabling isActive', async () => {
      await offering.update({ isActive: false });
      expect(offering.isActive).toBe(false);
    });
  });
});
