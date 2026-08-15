import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Create a Faculty user
  const faculty = await prisma.user.upsert({
    where: { email: 'dr.smith@anurag.edu.in' },
    update: {},
    create: {
      email: 'dr.smith@anurag.edu.in',
      name: 'Dr. John Smith',
      password: 'hashed_password_mock',
      role: 'FACULTY',
    },
  })

  // 2. Create a Mentor user
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor1@anurag.edu.in' },
    update: {},
    create: {
      email: 'mentor1@anurag.edu.in',
      name: 'Mr. David Lee',
      password: 'hashed_password_mock',
      role: 'MENTOR',
    },
  })

  // 3. Create a Student user with Profile
  const student = await prisma.user.upsert({
    where: { email: 'student1@anurag.edu.in' },
    update: {
      profile: {
        upsert: {
          create: { attendance: 87.5, credits: 135 },
          update: { attendance: 87.5, credits: 135 }
        }
      }
    },
    create: {
      email: 'student1@anurag.edu.in',
      name: 'Alice Johnson',
      password: 'hashed_password_mock',
      role: 'STUDENT',
      profile: {
        create: {
          attendance: 87.5,
          credits: 135,
        }
      }
    },
  })

  // 4. Create Courses
  const course1 = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      title: 'Introduction to Computer Science',
      code: 'CS101',
      credits: 3,
      facultyId: faculty.id,
    },
  })

  const course2 = await prisma.course.upsert({
    where: { code: 'MA201' },
    update: {},
    create: {
      title: 'Advanced Mathematics',
      code: 'MA201',
      credits: 4,
      facultyId: faculty.id,
    },
  })

  // 5. Enrollments
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
    update: {},
    create: { studentId: student.id, courseId: course1.id, progress: 75 },
  })
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
    update: {},
    create: { studentId: student.id, courseId: course2.id, progress: 45 },
  })

  // 6. Create Exams & Submissions
  const exam1 = await prisma.exam.create({
    data: {
      title: 'Week 1 Logic Assessment',
      mentorId: mentor.id,
      submissions: {
        create: {
          studentId: student.id,
          grade: 'A',
          isPosted: true // Posted! Will show on dashboard
        }
      }
    }
  })

  const exam2 = await prisma.exam.create({
    data: {
      title: 'Week 2 Math Assessment',
      mentorId: mentor.id,
      submissions: {
        create: {
          studentId: student.id,
          grade: 'B+',
          isPosted: false // Not posted! Won't show on dashboard
        }
      }
    }
  })

  console.log('Seeding finished with Exams.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
