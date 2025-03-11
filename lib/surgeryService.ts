import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Surgery } from "@/types";
import { surgeryTypes } from "@/lib/surgeryTypes";

// This function will handle both creating the surgery and updating the shifts
export async function bookSurgery(surgeryData: Partial<Surgery>, shiftIds: string[] | null) {
  try {
    // Remove any undefined fields from surgeryData
    const cleanedData = Object.fromEntries(Object.entries(surgeryData).filter(([_, value]) => value !== undefined));

    // Get surgery type details if available
    if (cleanedData.surgeryType) {
      const surgeryType = surgeryTypes.find((type) => type.id === cleanedData.surgeryType);
      if (surgeryType) {
        // Add materials to the surgery data
        cleanedData.materials = surgeryType.materials;

        // If no estimated duration was provided, use the one from the surgery type
        if (!cleanedData.estimatedDuration) {
          cleanedData.estimatedDuration = surgeryType.estimatedDuration;
        }
      }
    }

    // Step 1: Create the surgery document
    const surgeriesRef = collection(db, "surgeries");
    const surgeryRef = await addDoc(surgeriesRef, {
      ...cleanedData,
      createdAt: new Date().toISOString(),
    });

    // Step 2: If we have shiftIds, update each shift to mark it as booked
    if (shiftIds && shiftIds.length > 0) {
      for (const shiftId of shiftIds) {
        const shiftRef = doc(db, "shifts", shiftId);
        const shiftSnap = await getDoc(shiftRef);

        if (shiftSnap.exists() && !shiftSnap.data().booked) {
          // Update the shift to mark it as booked
          await updateDoc(shiftRef, { booked: true });
        }
      }
    }

    // Step 3: Send email notifications
    try {
      // Get surgeon details
      let surgeonEmail = "";
      let surgeonName = "";
      if (surgeryData.surgeonId) {
        const surgeonDoc = await getDoc(doc(db, "users", surgeryData.surgeonId));
        if (surgeonDoc.exists()) {
          surgeonEmail = surgeonDoc.data().email || "";
          surgeonName = surgeonDoc.data().name || "Surgeon";
        }
      }
      
      // Get hospital name
      let hospitalName = "Hospital";
      if (surgeryData.hospitalId) {
        const hospitalDoc = await getDoc(doc(db, "hospitals", surgeryData.hospitalId));
        if (hospitalDoc.exists()) {
          hospitalName = hospitalDoc.data().name || "Hospital";
        }
      }
      
      // Format surgery date and time
      let formattedDate = "Fecha no especificada";
      let formattedTime = "Hora no especificada";
      
      if (surgeryData.date) {
        const surgeryDate = new Date(surgeryData.date);
        formattedDate = surgeryDate.toLocaleDateString();
        formattedTime = surgeryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Send emails to neurophysiologists
      if (surgeryData.neurophysiologistIds && surgeryData.neurophysiologistIds.length > 0) {
        for (const neuroId of surgeryData.neurophysiologistIds) {
          const neuroDoc = await getDoc(doc(db, "users", neuroId));
          if (neuroDoc.exists() && neuroDoc.data().email) {
            // Option 1: Send direct email
            await addDoc(collection(db, "mail"), {
              to: neuroDoc.data().email,
              message: {
                subject: `Nueva Cirugía Programada: ${surgeryData.patientName || 'Paciente'}`,
                html: `
                  <h1>Nueva Cirugía Asignada</h1>
                  <p>Se te ha asignado una cirugía:</p>
                  <ul>
                    <li><strong>Paciente:</strong> ${surgeryData.patientName || 'No especificado'}</li>
                    <li><strong>Tipo de Cirugía:</strong> ${surgeryData.surgeryType || 'No especificado'}</li>
                    <li><strong>Fecha:</strong> ${formattedDate}</li>
                    <li><strong>Hora:</strong> ${formattedTime}</li>
                    <li><strong>Hospital:</strong> ${hospitalName}</li>
                    <li><strong>Cirujano:</strong> ${surgeonName}</li>
                    <li><strong>Duración Estimada:</strong> ${surgeryData.estimatedDuration || 'No especificada'} minutos</li>
                  </ul>
                  <p>Por favor, inicia sesión en el sistema NeuroTrack para más detalles.</p>
                `
              }
            });
            
            // Option 2: Use template (uncomment if you've created the template)
            /*
            await addDoc(collection(db, "mail"), {
              to: neuroDoc.data().email,
              template: {
                name: "surgery_notification",
                data: {
                  recipientName: neuroDoc.data().name || 'Neurofisiólogo',
                  surgeryType: surgeryData.surgeryType || 'No especificado',
                  patientName: surgeryData.patientName || 'No especificado',
                  surgeryDate: formattedDate,
                  surgeryTime: formattedTime,
                  hospitalName: hospitalName
                }
              }
            });
            */
          }
        }
      }
      
      // Send confirmation email to surgeon
      if (surgeonEmail) {
        await addDoc(collection(db, "mail"), {
          to: surgeonEmail,
          message: {
            subject: `Confirmación de Cirugía: ${surgeryData.patientName || 'Paciente'}`,
            html: `
              <h1>Confirmación de Cirugía</h1>
              <p>Has programado una cirugía:</p>
              <ul>
                <li><strong>Paciente:</strong> ${surgeryData.patientName || 'No especificado'}</li>
                <li><strong>Tipo de Cirugía:</strong> ${surgeryData.surgeryType || 'No especificado'}</li>
                <li><strong>Fecha:</strong> ${formattedDate}</li>
                <li><strong>Hora:</strong> ${formattedTime}</li>
                <li><strong>Hospital:</strong> ${hospitalName}</li>
                <li><strong>Duración Estimada:</strong> ${surgeryData.estimatedDuration || 'No especificada'} minutos</li>
              </ul>
              <p>Por favor, inicia sesión en el sistema NeuroTrack para más detalles.</p>
            `
          }
        });
      }
      
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError);
      // Continue even if email sending fails
    }

    return { success: true, surgeryId: surgeryRef.id };
  } catch (error) {
    console.error("Error booking surgery:", error);
    throw error;
  }
}

// Function to fetch surgery types
export async function fetchSurgeryTypes() {
  try {
    // Use the predefined surgery types from types/surgery.ts
    if (surgeryTypes && surgeryTypes.length > 0) {
      return surgeryTypes;
    }

    // Fallback to fetching from Firestore if needed
    try {
      const surgeryTypesRef = collection(db, "surgeryTypes");
      const querySnapshot = await getDocs(surgeryTypesRef);

      if (querySnapshot.empty) {
        return surgeryTypes || [];
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn("Could not fetch surgery types from Firestore, using defaults", error);
      return surgeryTypes || [];
    }
  } catch (error) {
    console.error("Error in fetchSurgeryTypes:", error);
    throw error;
  }
}