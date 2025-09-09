import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/app/lib/backend"
import { requireRole } from "@/lib/api-auth"

// Helper to convert array of objects to CSV
function arrayToCSV(data: any[], filename: string): string {
  if (!data.length) return `${filename}\nNo data available`

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header]
        // Escape commas and quotes in CSV
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val ?? ''
      }).join(',')
    )
  ]
  return csvRows.join('\n')
}

// Returns CSV files as a simple concatenated text (or could be zip)
export const GET = requireRole(["admin"])(async (request: NextRequest) => {
  // Get auth token from request and forward as Authorization header
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : request.cookies.get("auth-token")?.value

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const headers = { Authorization: `Bearer ${token}` }
  // Fetch all in parallel through backend
  const [studentsRes, teachersRes, classesRes] = await Promise.all([
    fetch(`${BACKEND_URL}/students`, { headers }),
    fetch(`${BACKEND_URL}/teachers`, { headers }),
    fetch(`${BACKEND_URL}/classes`, { headers }),
  ])

  if (!studentsRes.ok || !teachersRes.ok || !classesRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch data for export" },
      { status: 500 }
    )
  }

  const [students, teachers, classes] = await Promise.all([
    studentsRes.json(),
    teachersRes.json(),
    classesRes.json(),
  ])

  // Generate CSV content for each dataset
  const studentsCSV = arrayToCSV(students, 'Students')
  const teachersCSV = arrayToCSV(teachers, 'Teachers')
  const classesCSV = arrayToCSV(classes, 'Classes')

  // Combine all CSVs with separators
  const combinedCSV = [
    '=== STUDENTS ===',
    studentsCSV,
    '',
    '=== TEACHERS ===',
    teachersCSV,
    '',
    '=== CLASSES ===',
    classesCSV,
    '',
    `Generated at: ${new Date().toISOString()}`
  ].join('\n')

  return new NextResponse(combinedCSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=school-export-${Date.now()}.csv`,
    },
  })
})

