import { addDoc, collection, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Surgery, User, Hospital } from "@/types"
import { jsPDF } from "jspdf"
import { surgeryTypes } from "@/lib/surgeryTypes" // Import surgery types

/**
 * Sends notification emails for a surgery booking using the surgery ID
 * @param surgeryId The ID of the surgery document
 * @param bookerId The ID of the user who booked the surgery (if different from surgeon)
 * @param additionalRecipients Optional array of additional email addresses to send notifications to
 */
export async function sendSurgeryNotificationEmails(
  surgeryId: string,
  bookerId?: string,
  additionalRecipients: string[] = [],
) {
  try {
    // Fetch the surgery document
    const surgeryRef = doc(db, "surgeries", surgeryId)
    const surgerySnap = await getDoc(surgeryRef)

    if (!surgerySnap.exists()) {
      console.error("Surgery not found")
      return { success: false, error: "Surgery not found" }
    }

    const surgery = { id: surgeryId, ...surgerySnap.data() } as Surgery

    // Fetch the surgeon
    const surgeonRef = doc(db, "users", surgery.surgeonId)
    const surgeonSnap = await getDoc(surgeonRef)

    if (!surgeonSnap.exists()) {
      console.error("Surgeon not found")
      return { success: false, error: "Surgeon not found" }
    }

    const surgeon = { id: surgery.surgeonId, ...surgeonSnap.data() } as User

    // Fetch the neurophysiologists
    const neurophysiologists: User[] = []
    for (const neuroId of surgery.neurophysiologistIds) {
      const neuroRef = doc(db, "users", neuroId)
      const neuroSnap = await getDoc(neuroRef)

      if (neuroSnap.exists()) {
        neurophysiologists.push({ id: neuroId, ...neuroSnap.data() } as User)
      }
    }

    if (neurophysiologists.length === 0) {
      console.error("No neurophysiologists found")
      return { success: false, error: "No neurophysiologists found" }
    }

    // Fetch the hospital
    const hospitalRef = doc(db, "hospitals", surgery.hospitalId)
    const hospitalSnap = await getDoc(hospitalRef)

    if (!hospitalSnap.exists()) {
      console.error("Hospital not found")
      return { success: false, error: "Hospital not found" }
    }

    const hospital = { id: surgery.hospitalId, ...hospitalSnap.data() } as Hospital

    // Determine the booker - check both explicit bookerId and surgery.bookedBy
    let booker: User | null = null

    // First check if we have a bookerId parameter
    if (bookerId && bookerId !== surgery.surgeonId) {
      const bookerRef = doc(db, "users", bookerId)
      const bookerSnap = await getDoc(bookerRef)

      if (bookerSnap.exists()) {
        booker = { id: bookerId, ...bookerSnap.data() } as User
      }
    }
    // If no bookerId or couldn't find the user, check surgery.bookedBy
    else if (surgery.bookedBy && surgery.bookedBy.id && surgery.bookedBy.id !== surgery.surgeonId) {
      const bookerRef = doc(db, "users", surgery.bookedBy.id)
      const bookerSnap = await getDoc(bookerRef)

      if (bookerSnap.exists()) {
        booker = { id: surgery.bookedBy.id, ...bookerSnap.data() } as User
      } else if (surgery.bookedBy.email) {
        // If we can't find the user document but have email in bookedBy, create a minimal user object
        booker = {
          id: surgery.bookedBy.id,
          email: surgery.bookedBy.email,
          name: surgery.bookedBy.name || "Usuario",
          role: surgery.bookedBy.role || "unknown",
        } as User
      }
    }

    // Format the date
    const surgeryDate = new Date(surgery.date).toLocaleDateString()

    // Calculate end time based on estimated duration (assuming duration is in minutes)
    const startDate = new Date(surgery.date)
    const endDate = new Date(startDate.getTime() + surgery.estimatedDuration * 60000)
    const startTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const endTime = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Format materials list if available
    let materialsHtml = ""
    if (surgery.materials && surgery.materials.length > 0) {
      materialsHtml = `
        <p><strong>Materials Required:</strong></p>
        <ul>
          ${surgery.materials
            .map(
              (material) =>
                `<li>${material.name} (${material.quantity}) ${material.ref ? `- Ref: ${material.ref}` : ""}</li>`,
            )
            .join("")}
        </ul>
      `
    }

    // Generate PDF attachment
    const pdfAttachment = await generateSurgeryPDF(surgery, surgeon, neurophysiologists, hospital)

    // Email to surgeon
    await addDoc(collection(db, "mail"), {
      to: surgeon.email,
      message: {
        subject: `Confirmación de Cirugía - ${surgery.patientName}`,
        html: `
          <h1>Confirmación de Cirugía</h1>
          <p>Estimado/a Dr. ${surgeon.name},</p>
          <p>Su cirugía para el paciente ${surgery.patientName} ha sido programada exitosamente.</p>
          <p><strong>Detalles:</strong></p>
          <ul>
            <li>Hospital: ${hospital.name}</li>
            <li>Fecha: ${surgeryDate}</li>
            <li>Hora: ${startTime} - ${endTime} (Estimado)</li>
            <li>Tipo de Cirugía: ${surgery.surgeryType}</li>
            <li>Neurofisiólogos: ${neurophysiologists.map((n) => `Dr. ${n.name}`).join(", ")}</li>
            <li>Estado: ${surgery.status}</li>
          </ul>
          ${materialsHtml}
          ${surgery.notes ? `<p><strong>Notas:</strong> ${surgery.notes}</p>` : ""}
          <p>Gracias por usar NeuroTrack.</p>
        `,
        attachments: [
          {
            filename: `cirugia_${surgeryId}.pdf`,
            content: pdfAttachment,
            contentType: "application/pdf",
            encoding: "base64",
          },
        ],
      },
    })

    // Email to each neurophysiologist
    for (const neurophysiologist of neurophysiologists) {
      await addDoc(collection(db, "mail"), {
        to: neurophysiologist.email,
        message: {
          subject: `Nueva Asignación de Cirugía - ${surgery.patientName}`,
          html: `
            <h1>Nueva Asignación de Cirugía</h1>
            <p>Estimado/a Dr. ${neurophysiologist.name},</p>
            <p>Ha sido asignado/a a una cirugía con el Dr. ${surgeon.name} para el paciente ${surgery.patientName}.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li>Hospital: ${hospital.name}</li>
              <li>Fecha: ${surgeryDate}</li>
              <li>Hora: ${startTime} - ${endTime} (Estimado)</li>
              <li>Tipo de Cirugía: ${surgery.surgeryType}</li>
              <li>Cirujano: Dr. ${surgeon.name}</li>
              <li>Estado: ${surgery.status}</li>
            </ul>
            ${materialsHtml}
            ${surgery.notes ? `<p><strong>Notas:</strong> ${surgery.notes}</p>` : ""}
            <p>Por favor, asegúrese de estar disponible a la hora programada.</p>
            <p>Gracias por usar NeuroTrack.</p>
          `,
          attachments: [
            {
              filename: `cirugia_${surgeryId}.pdf`,
              content: pdfAttachment,
              contentType: "application/pdf",
              encoding: "base64",
            },
          ],
        },
      })
    }

    // Email to the booker if different from surgeon
    if (booker && booker.email) {
      await addDoc(collection(db, "mail"), {
        to: booker.email,
        message: {
          subject: `Confirmación de Reserva de Cirugía - ${surgery.patientName}`,
          html: `
            <h1>Confirmación de Reserva de Cirugía</h1>
            <p>Estimado/a ${booker.name},</p>
            <p>La cirugía que ha programado para el paciente ${surgery.patientName} ha sido confirmada.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li>Hospital: ${hospital.name}</li>
              <li>Fecha: ${surgeryDate}</li>
              <li>Hora: ${startTime} - ${endTime} (Estimado)</li>
              <li>Tipo de Cirugía: ${surgery.surgeryType}</li>
              <li>Cirujano: Dr. ${surgeon.name}</li>
              <li>Neurofisiólogos: ${neurophysiologists.map((n) => `Dr. ${n.name}`).join(", ")}</li>
              <li>Estado: ${surgery.status}</li>
            </ul>
            ${materialsHtml}
            ${surgery.notes ? `<p><strong>Notas:</strong> ${surgery.notes}</p>` : ""}
            <p>Gracias por usar NeuroTrack.</p>
          `,
          attachments: [
            {
              filename: `cirugia_${surgeryId}.pdf`,
              content: pdfAttachment,
              contentType: "application/pdf",
              encoding: "base64",
            },
          ],
        },
      })
    }

    // Send to additional recipients if provided
    if (additionalRecipients.length > 0) {
      for (const email of additionalRecipients) {
        await addDoc(collection(db, "mail"), {
          to: email,
          message: {
            subject: `Información de Cirugía - ${surgery.patientName}`,
            html: `
              <h1>Información de Cirugía</h1>
              <p>Se ha programado una nueva cirugía con los siguientes detalles:</p>
              <p><strong>Detalles:</strong></p>
              <ul>
                <li>Paciente: ${surgery.patientName}</li>
                <li>Hospital: ${hospital.name}</li>
                <li>Fecha: ${surgeryDate}</li>
                <li>Hora: ${startTime} - ${endTime} (Estimado)</li>
                <li>Tipo de Cirugía: ${surgery.surgeryType}</li>
                <li>Cirujano: Dr. ${surgeon.name}</li>
                <li>Neurofisiólogos: ${neurophysiologists.map((n) => `Dr. ${n.name}`).join(", ")}</li>
                <li>Estado: ${surgery.status}</li>
              </ul>
              ${materialsHtml}
              ${surgery.notes ? `<p><strong>Notas:</strong> ${surgery.notes}</p>` : ""}
              <p>Este es un mensaje informativo. Por favor, no responda a este correo.</p>
              <p>Gracias por usar NeuroTrack.</p>
            `,
            attachments: [
              {
                filename: `cirugia_${surgeryId}.pdf`,
                content: pdfAttachment,
                contentType: "application/pdf",
                encoding: "base64",
              },
            ],
          },
        })
      }
    }

    console.log("Surgery notification emails sent successfully")
    return { success: true }
  } catch (error) {
    console.error("Error sending surgery notification emails:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate a PDF for the surgery details
 */
async function generateSurgeryPDF(
  surgery: Surgery,
  surgeon: User,
  neurophysiologists: User[],
  hospital: Hospital,
): Promise<string> {
  try {
    // Create a new PDF document with explicit configuration
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

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

    // Calculate the Y position for materials section
    let currentY = 140 + neurophysiologists.length * 10 + 10

    // Get materials - use surgery.materials if available, otherwise get from surgery type
    let materials = surgery.materials || []

    // If no materials in surgery object, try to get them from the surgery type
    if ((!materials || materials.length === 0) && surgery.surgeryType) {
      try {
        // Find the matching surgery type by name or ID
        const matchingSurgeryType = surgeryTypes.find(
          (type) => type.name === surgery.surgeryType || type.id === surgery.surgeryType,
        )

        if (matchingSurgeryType && matchingSurgeryType.materials) {
          materials = matchingSurgeryType.materials
          console.log(`Found materials for surgery type ${surgery.surgeryType}:`, materials)
        }
      } catch (error) {
        console.error("Error getting materials for surgery type:", error)
      }
    }

    // Add materials section with a box around it for emphasis
    if (materials && materials.length > 0) {
      // Add a title for materials section
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("MATERIALES REQUERIDOS:", 20, currentY)
      currentY += 10

      // Draw a box around the materials section
      const boxStartY = currentY - 5
      const boxHeight = materials.length * 10 + 10

      // Add each material with quantity and reference
      doc.setFontSize(12)
      materials.forEach((material, index) => {
        const materialText = `${index + 1}. ${material.name} (${material.quantity}) ${material.ref ? `- Ref: ${material.ref}` : ""}`
        doc.text(materialText, 25, currentY + index * 10)
      })

      // Draw the box
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.5)
      doc.rect(15, boxStartY, 180, boxHeight)

      // Update current Y position
      currentY += materials.length * 10 + 15
    } else {
      // If no materials, add a note
      doc.text("No se requieren materiales específicos para esta cirugía.", 20, currentY)
      currentY += 15
    }

    // Add notes if available
    if (surgery.notes) {
      doc.setFontSize(14)
      doc.text("Notas:", 20, currentY)
      currentY += 10

      // Handle long notes by wrapping text
      doc.setFontSize(12)
      const splitNotes = doc.splitTextToSize(surgery.notes, 170)
      doc.text(splitNotes, 25, currentY)
      currentY += splitNotes.length * 7 + 10
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

    // Convert to base64 - use output('dataurlstring') for complete data URL
    const pdfBase64 = doc.output("dataurlstring").split(",")[1]

    // Ensure we're returning a valid base64 string
    if (!pdfBase64 || pdfBase64.trim() === "") {
      throw new Error("Generated PDF is empty")
    }

    return pdfBase64
  } catch (error) {
    console.error("Error generating PDF:", error)

    // Create a simple valid PDF as fallback
    const fallbackDoc = new jsPDF()
    fallbackDoc.text("Error generating detailed PDF. Basic information:", 10, 10)
    fallbackDoc.text(`Patient: ${surgery.patientName}`, 10, 20)
    fallbackDoc.text(`Surgery Type: ${surgery.surgeryType}`, 10, 30)
    fallbackDoc.text(`Date: ${new Date(surgery.date).toLocaleDateString()}`, 10, 40)

    if (surgery.materials && surgery.materials.length > 0) {
      fallbackDoc.text("Materials:", 10, 50)
      surgery.materials.forEach((material, index) => {
        fallbackDoc.text(
          `- ${material.name} (${material.quantity}) ${material.ref ? `Ref: ${material.ref}` : ""}`,
          15,
          60 + index * 10,
        )
      })
    }

    return fallbackDoc.output("dataurlstring").split(",")[1]
  }
}

/**
 * Sends a test email to verify the email functionality is working
 * @param email The recipient email address
 * @param subject Optional custom subject line
 * @param message Optional custom message
 * @returns Result of the email sending operation
 */
export async function sendTestEmail(
  email: string,
  subject = "Test Email from NeuroTrack",
  message = "This is a test email to verify the email functionality is working.",
) {
  try {
    console.log(`Attempting to send test email to: ${email}`)

    // Create the email document in Firestore
    const docRef = await addDoc(collection(db, "mail"), {
      to: email,
      message: {
        subject,
        text: message,
        html: `<h1>${subject}</h1><p>${message}</p><p>Sent at: ${new Date().toISOString()}</p>`,
      },
    })

    console.log("Email document created successfully with ID:", docRef.id)
    return {
      success: true,
      docId: docRef.id,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      errorObject: error,
      timestamp: new Date().toISOString(),
    }
  }
}

