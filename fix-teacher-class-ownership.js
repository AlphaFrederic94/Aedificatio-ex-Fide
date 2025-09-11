const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = new PrismaClient();

async function fixTeacherClassOwnership() {
  console.log('🔧 FIXING TEACHER CLASS OWNERSHIP');
  console.log('=================================');

  try {
    // Get teacher details
    const teacher = await prisma.teacher.findFirst({
      where: { email: 'ukuqala@gmail.com' },
      include: { user: true, school: true }
    });

    if (!teacher) {
      console.log('❌ Teacher not found');
      return;
    }

    console.log(`👨‍🏫 Teacher: ${teacher.firstName} ${teacher.lastName}`);
    console.log(`   ID: ${teacher.id}`);
    console.log(`   School: ${teacher.school?.name || 'Unknown'}`);

    // Get student details for school alignment
    const student = await prisma.student.findFirst({
      where: { email: 'noafrederic91@gmail.com' },
      include: { school: true }
    });

    if (!student) {
      console.log('❌ Student not found');
      return;
    }

    console.log(`👨‍🎓 Student: ${student.firstName} ${student.lastName}`);
    console.log(`   School: ${student.school?.name || 'Unknown'}`);

    // Check current classes
    const currentClasses = await prisma.class.findMany({
      where: { teacherId: teacher.id, deletedAt: null },
      include: { teacher: true }
    });

    console.log(`\n📚 Current classes owned by teacher: ${currentClasses.length}`);
    currentClasses.forEach(c => {
      console.log(`   - ${c.name} (${c.subject}) - Status: ${c.status}`);
    });

    // Get all classes in the school
    const schoolClasses = await prisma.class.findMany({
      where: { schoolId: student.schoolId, deletedAt: null },
      include: { teacher: true }
    });

    console.log(`\n🏫 All classes in student's school: ${schoolClasses.length}`);
    schoolClasses.forEach(c => {
      const teacherName = c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : 'No Teacher';
      console.log(`   - ${c.name} (${c.subject}) - Teacher: ${teacherName} - Status: ${c.status}`);
    });

    // Ensure teacher is in the same school as student
    if (teacher.schoolId !== student.schoolId) {
      console.log('\n🔄 Moving teacher to student\'s school...');
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { schoolId: student.schoolId }
      });
      console.log('✅ Teacher moved to student\'s school');
    }

    // Create or assign classes to the teacher
    if (currentClasses.length === 0) {
      console.log('\n🆕 Creating new classes for teacher...');

      // Create Chemistry class
      const chemClass = await prisma.class.create({
        data: {
          name: 'Advanced Chemistry',
          subject: 'Chemistry',
          grade: '12',
          room: 'Lab 201',
          schedule: 'Monday 10:00-11:30, Wednesday 14:00-15:30',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          description: 'Advanced chemistry course covering organic chemistry, inorganic chemistry, and physical chemistry',
          capacity: 25,
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          schoolId: student.schoolId,
          status: 'approved'
        }
      });

      console.log(`✅ Created Chemistry class: ${chemClass.name} (${chemClass.id})`);

      // Create Mathematics class
      const mathClass = await prisma.class.create({
        data: {
          name: 'Advanced Mathematics',
          subject: 'Mathematics',
          grade: '12',
          room: 'Room 301',
          schedule: 'Tuesday 09:00-10:30, Thursday 11:00-12:30',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          description: 'Advanced mathematics course covering calculus, algebra, geometry, and statistics',
          capacity: 30,
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          schoolId: student.schoolId,
          status: 'approved'
        }
      });

      console.log(`✅ Created Mathematics class: ${mathClass.name} (${mathClass.id})`);

      // Enroll the student in both classes
      console.log('\n👨‍🎓 Enrolling student in new classes...');

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: chemClass.id,
          enrollmentDate: new Date(),
          status: 'active'
        }
      });

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: mathClass.id,
          enrollmentDate: new Date(),
          status: 'active'
        }
      });

      console.log('✅ Student enrolled in both classes');

    } else {
      // Update existing classes to ensure they're in the right school
      console.log('\n🔄 Updating existing classes...');
      
      await prisma.class.updateMany({
        where: { teacherId: teacher.id },
        data: { 
          schoolId: student.schoolId,
          status: 'approved'
        }
      });

      console.log('✅ Updated existing classes');

      // Ensure student is enrolled in teacher's classes
      for (const classItem of currentClasses) {
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: student.id,
            classId: classItem.id
          }
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              classId: classItem.id,
              enrollmentDate: new Date(),
              status: 'active'
            }
          });
          console.log(`✅ Enrolled student in ${classItem.name}`);
        }
      }
    }

    // Verify final setup
    console.log('\n✅ FINAL VERIFICATION:');
    const finalClasses = await prisma.class.findMany({
      where: { teacherId: teacher.id, deletedAt: null },
      include: {
        teacher: true
      }
    });

    console.log(`📚 Teacher now owns ${finalClasses.length} classes:`);
    for (const c of finalClasses) {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId: c.id },
        include: { student: true }
      });

      const hasTargetStudent = enrollments.some(e => e.student.email === 'noafrederic91@gmail.com');
      console.log(`   - ${c.name} (${c.subject})`);
      console.log(`     Students: ${enrollments.length}, Target student enrolled: ${hasTargetStudent ? '✅' : '❌'}`);
    }

    console.log('\n🎉 Teacher class ownership fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTeacherClassOwnership();
