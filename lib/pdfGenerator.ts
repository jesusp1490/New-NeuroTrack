import { jsPDF } from "jspdf"
import { Surgery, User, Hospital } from "@/types"

export async function generateSurgeryPDF(
  surgery: Surgery,
  surgeon: User,
  neurophysiologists: User[],
  hospital: Hospital,
): Promise<string> {
  // Create a new PDF document
  const doc = new jsPDF()

  // Add logo (if available)
  // doc.addImage('/logo.png', 'PNG', 10, 10, 30, 30)

  // Add title
  doc.setFontSize(20)
  doc.text("NeuroTrack - Detalles de Cirugía", 105, 20, { align: "center" })

  // Add surgery details
  doc.setFontSize(12)
  doc.text(`Paciente: ${surgery.patientName}`, 20, 40)
  doc.text(`Tipo de Cirugía: ${surgery.surgeryType}`, 20, 50)

  // Format date
  const surgeryDate = new Date(surgery.date)
  const formattedDate = surgeryDate.toLocaleDateString()

  // Calculate end time based on estimated duration
  const startTime = surgeryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const endDate = new Date(surgeryDate.getTime() + surgery.estimatedDuration * 60000)
  const endTime = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  doc.text(`Fecha: ${formattedDate}`, 20, 60)
  doc.text(`Hora: ${startTime} - ${endTime}`, 20, 70)
  doc.text(`Hospital: ${hospital.name}`, 20, 80)

  // Add surgeon info
  doc.text(`Cirujano: Dr. ${surgeon.name}`, 20, 100)
  doc.text(`Email: ${surgeon.email}`, 20, 110)

  // Add neurophysiologists
  doc.text("Neurofisiólogos:", 20, 130)
  neurophysiologists.forEach((neuro, index) => {
    doc.text(`- Dr. ${neuro.name} (${neuro.email})`, 30, 140 + index * 10)
  })

  // Add materials if available
  if (surgery.materials && surgery.materials.length > 0) {
    const yPos = 140 + neurophysiologists.length * 10 + 10
    doc.text("Materiales Requeridos:", 20, yPos)
    surgery.materials.forEach((material, index) => {
      doc.text(
        `- ${material.name} (${material.quantity}) ${material.ref ? `- Ref: ${material.ref}` : ""}`,
        30,
        yPos + 10 + index * 10,
      )
    })
  }

  // Add notes if available
  if (surgery.notes) {
    const yPos = 140 + neurophysiologists.length * 10 + (surgery.materials ? surgery.materials.length * 10 + 20 : 10)
    doc.text("Notas:", 20, yPos)
    doc.text(surgery.notes, 30, yPos + 10)
  }

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(`Generado por NeuroTrack - ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 10, {
      align: "center",
    })
  }

  // Convert to base64
  return doc.output("datauristring").split(",")[1]
}

