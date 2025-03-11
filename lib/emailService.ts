import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Sends a simple email using the Firebase Firestore Send Email extension
 */

export async function sendEmail(
  to: string, 
  subject: string, 
  textContent: string, 
  htmlContent: string
) {
  try {
    const result = await addDoc(collection(db, "mail"), {
      to,
      message: {
        subject,
        text: textContent,
        html: htmlContent
      }
    });
    
    console.log("Email sent successfully, document ID:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

/**
 * Sends an email using a template from the email_templates collection
 */
export async function sendTemplateEmail(
  to: string,
  templateName: string,
  templateData: Record<string, string>
) {
  try {
    const result = await addDoc(collection(db, "mail"), {
      to,
      template: {
        name: templateName,
        data: templateData
      }
    });
    
    console.log("Template email sent successfully, document ID:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Error sending template email:", error);
    return { success: false, error };
  }
}

/**
 * Creates an email template in the email_templates collection
 */
export async function createEmailTemplate(
  templateName: string,
  subject: string,
  htmlContent: string
) {
  try {
    await setDoc(doc(db, "email_templates", templateName), {
      subject,
      html: htmlContent
    });
    
    console.log("Email template created successfully:", templateName);
    return { success: true };
  } catch (error) {
    console.error("Error creating email template:", error);
    return { success: false, error };
  }
}

/**
 * Sends a test email to verify the extension is working
 */
export async function sendTestEmail(recipientEmail: string) {
  return sendEmail(
    recipientEmail,
    "NeuroTrack Test Email",
    "This is a test email from NeuroTrack.",
    "<h1>NeuroTrack Test</h1><p>This is a test email from the NeuroTrack application.</p>"
  );
}