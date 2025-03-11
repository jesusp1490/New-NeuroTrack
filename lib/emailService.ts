import { addDoc, collection, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Surgery, User, Hospital } from "@/types"

/**
 * Sends notification emails for a surgery booking using the surgery ID
 * @param surgeryId The ID of the surgery document
 */
export async function sendSurgeryNotificationEmails(surgeryId: string) {
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
        },
      })
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
 * Sends a test email to verify the email extension is working
 * @param email The recipient email address
 */
export async function sendTestEmail(email: string) {
  try {
    const docRef = await addDoc(collection(db, "mail"), {
      to: email,
      message: {
        subject: "Test Email from NeuroTrack",
        text: "This is a test email to verify the email extension is working.",
        html: "<h1>Test Email</h1><p>This is a test email to verify the email extension is working.</p>",
      },
    })

    console.log("Test email document created with ID:", docRef.id)
    return { success: true, docId: docRef.id }
  } catch (error) {
    console.error("Error sending test email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

