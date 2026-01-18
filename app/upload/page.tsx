import { redirect } from "next/navigation";

/**
 * /upload is deprecated. All uploads go through Uploads (/?view=uploads)
 * which has collection selection and unified image/video flow.
 */
export default function UploadPage() {
  redirect("/?view=uploads");
}
