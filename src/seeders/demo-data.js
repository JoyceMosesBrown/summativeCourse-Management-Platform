const { User, Manager, Facilitator, Student, Module, Cohort, Class, Mode, CourseOffering } = require('../models');
const logger = require('../utils/logger');

const seedDemoData = async () => {
  try {
    logger.info('Starting demo data seeding...');

    // Create demo users
    const managerUser = await User.create({
      email: 'manager@university.edu',
      password: 'Manager123!',
      firstName: 'John',
      lastName: 'Smith',
      role: 'manager'
    });

    const facilitatorUser1 = await User.create({
      email: 'facilitator1@university.edu',
      password: 'Facilitator123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'facilitator'
    });

    const facilitatorUser2 = await User.create({
      email: 'facilitator2@university.edu',
      password: 'Facilitator123!',
      firstName: 'Michael',
      lastName: 'Brown',
      role: 'facilitator'
    });

    const studentUser = await User.create({
      email: 'student@university.edu',
      password: 'Student123!',
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'student'
    });

    // Create profiles
    const manager = await Manager.create({
      userId: managerUser.id,
      employeeId: 'MGR001',
      department: 'Computer Science',
      accessLevel: 'full'
    });

    const facilitator1 = await Facilitator.create({
      userId: facilitatorUser1.id,
      employeeId: 'FAC001',
      specialization: 'Web Development',
      experienceYears: 5,
      qualifications: ['MSc Computer Science', 'AWS Certified']
    });

    const facilitator2 = await Facilitator.create({
      userId: facilitatorUser2.id,
      employeeId: 'FAC002',
      specialization: 'Database Systems',
      experienceYears: 8,
      qualifications: ['PhD Computer Science', 'Oracle Certified']
    });

    const student = await Student.create({
      userId: studentUser.id,
      studentId: 'STU001'
    });

    // Create modules
    const modules = await Module.bulkCreate([
      {
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts using JavaScript',
        credits: 6,
        level: 'undergraduate',
        prerequisites: []
      },
      {
        code: 'CS201',
        name: 'Web Development Fundamentals',
        description: 'HTML, CSS, and JavaScript for web development',
        credits: 6,
        level: 'undergraduate',
        prerequisites: ['CS101']
      },
      {
        code: 'CS301',
        name: 'Database Design',
        description: 'Relational database design and SQL',
        credits: 6,
        level: 'undergraduate',
        prerequisites: ['CS101']
      },
      {
        code: 'CS401',
        name: 'Advanced Web Applications',
        description: 'Full-stack web application development',
        credits: 8,
        level: 'postgraduate',
        prerequisites: ['CS201', 'CS301']
      }
    ]);

    // Create cohorts
    const cohorts = await Cohort.bulkCreate([
      {
        name: 'Computer Science 2024',
        year: 2024,
        program: 'Bachelor of Computer Science',
        intakePeriod: 'HT1',
        maxStudents: 30
      },
      {
        name: 'Software Engineering 2024',
        year: 2024,
        program: 'Master of Software Engineering',
        intakePeriod: 'HT2',
        maxStudents: 25
      },
      {
        name: 'Web Development 2024',
        year: 2024,
        program: 'Diploma in Web Development',
        intakePeriod: 'FT',
        maxStudents: 20
      }
    ]);

    // Create classes
    const classes = await Class.bulkCreate([
      {
        code: '2024S',
        year: 2024,
        semester: 'S',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-30')
      },
      {
        code: '2024J',
        year: 2024,
        semester: 'J',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-28')
      },
      {
        code: '2025S',
        year: 2025,
        semester: 'S',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-30')
      }
    ]);

    // Create modes
    const modes = await Mode.bulkCreate([
      {
        name: 'online',
        description: 'Fully online delivery with virtual classrooms',
        requiresPhysicalLocation: false
      },
      {
        name: 'in-person',
        description: 'Traditional classroom-based learning',
        requiresPhysicalLocation: true
      },
      {
        name: 'hybrid',
        description: 'Combination of online and in-person delivery',
        requiresPhysicalLocation: true
      }
    ]);

    // Update student with cohort
    await student.update({ cohortId: cohorts[0].id });

    // Create course offerings
    const courseOfferings = await CourseOffering.bulkCreate([
      {
        moduleId: modules[0].id, // CS101
        facilitatorId: facilitator1.id,
        cohortId: cohorts[0].id,
        classId: classes[0].id,
        modeId: modes[0].id, // online
        trimester: 'T1',
        maxEnrollment: 30,
        currentEnrollment: 25,
        schedule: {
          monday: { start: '09:00', end: '11:00' },
          wednesday: { start: '14:00', end: '16:00' }
        }
      },
      {
        moduleId: modules[1].id, // CS201
        facilitatorId: facilitator1.id,
        cohortId: cohorts[0].id,
        classId: classes[0].id,
        modeId: modes[2].id, // hybrid
        trimester: 'T2',
        maxEnrollment: 30,
        currentEnrollment: 28,
        location: 'Room A101',
        schedule: {
          tuesday: { start: '10:00', end: '12:00' },
          thursday: { start: '13:00', end: '15:00' }
        }
      },
      {
        moduleId: modules[2].id, // CS301
        facilitatorId: facilitator2.id,
        cohortId: cohorts[0].id,
        classId: classes[0].id,
        modeId: modes[1].id, // in-person
        trimester: 'T2',
        maxEnrollment: 25,
        currentEnrollment: 22,
        location: 'Lab B205',
        schedule: {
          monday: { start: '14:00', end: '17:00' },
          friday: { start: '09:00', end: '12:00' }
        }
      },
      {
        moduleId: modules[3].id, // CS401
        facilitatorId: facilitator1.id,
        cohortId: cohorts[1].id,
        classId: classes[0].id,
        modeId: modes[2].id, // hybrid
        trimester: 'T3',
        maxEnrollment: 20,
        currentEnrollment: 18,
        location: 'Room C301',
        schedule: {
          wednesday: { start: '18:00', end: '21:00' },
          saturday: { start: '09:00', end: '12:00' }
        }
      }
    ]);

    logger.info('Demo data seeded successfully!');
    logger.info('Demo accounts created:');
    logger.info('Manager: manager@university.edu / Manager123!');
    logger.info('Facilitator 1: facilitator1@university.edu / Facilitator123!');
    logger.info('Facilitator 2: facilitator2@university.edu / Facilitator123!');
    logger.info('Student: student@university.edu / Student123!');

    return {
      users: { managerUser, facilitatorUser1, facilitatorUser2, studentUser },
      profiles: { manager, facilitator1, facilitator2, student },
      modules,
      cohorts,
      classes,
      modes,
      courseOfferings
    };
  } catch (error) {
    logger.error('Error seeding demo data:', error);
    throw error;
  }
};

module.exports = { seedDemoData };