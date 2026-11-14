
import { supabase } from "../lib/supabase";


// ============================================
// STUDENT PROFILE TYPE
// ============================================

export interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}


// ============================================
// PROFILE UPDATE TYPE
// ============================================

export interface UpdateProfileRequest {
  full_name: string;
}


// ============================================
// LOAD CURRENT STUDENT PROFILE
// ============================================

export async function getMyProfile(): Promise<StudentProfile | null> {

  // Get the authenticated student.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(
      `Authentication error: ${authError.message}`
    );
  }

  if (!user) {
    throw new Error(
      "You must be signed in to access your profile."
    );
  }

  // Fetch the student's own profile.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, created_at, updated_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not load student profile: ${error.message}`
    );
  }

  return data as StudentProfile | null;
}


// ============================================
// UPDATE STUDENT PROFILE
// ============================================

export async function updateMyProfile(
  payload: UpdateProfileRequest
): Promise<StudentProfile> {

  const fullName = payload.full_name.trim();

  if (!fullName) {
    throw new Error(
      "Please enter your full name."
    );
  }

  if (fullName.length > 100) {
    throw new Error(
      "Your name cannot exceed 100 characters."
    );
  }

  // Verify the authenticated student.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(
      `Authentication error: ${authError.message}`
    );
  }

  if (!user) {
    throw new Error(
      "You must be signed in to update your profile."
    );
  }

  // Update the database profile.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id)
    .select(
      "id, full_name, email, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not update student profile: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      "Your profile was not found. Check that the automatic profile trigger created your profile."
    );
  }

  // Keep the Supabase Auth metadata synchronized.
  const { error: metadataError } =
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    });

  if (metadataError) {
    console.warn(
      "Profile saved, but authentication metadata could not be updated:",
      metadataError.message
    );
  }

  return data as StudentProfile;
}
