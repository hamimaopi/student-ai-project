/**
 * Student avatar mapping utility.
 * Maps Marcus to Fregley.png, Lena to Lupe Lopez.png, and Sue to avatar_sue.png.
 */

export const STUDENT_AVATARS: Record<string, string> = {
  Marcus: '/images/Fregley.png',
  Lena: '/images/Lupe Lopez.png',
  Sue: '/images/avatar_sue.png'
};

export function getStudentAvatarUrl(
  studentName?: string | null,
  avatarUrl?: string | null
): string {
  if (studentName) {
    const trimmed = studentName.trim().toLowerCase();
    if (trimmed === 'the class' || trimmed === 'class') {
      return '';
    }
    if (trimmed === 'marcus') {
      return STUDENT_AVATARS.Marcus;
    }
    if (trimmed === 'lena') {
      return STUDENT_AVATARS.Lena;
    }
    if (trimmed === 'sue') {
      return STUDENT_AVATARS.Sue;
    }
  }

  if (avatarUrl) {
    const lowerUrl = avatarUrl.toLowerCase();
    if (lowerUrl.includes('marcus') || lowerUrl.includes('fregley')) {
      return STUDENT_AVATARS.Marcus;
    }
    if (lowerUrl.includes('lena') || lowerUrl.includes('lupe')) {
      return STUDENT_AVATARS.Lena;
    }
    if (lowerUrl.includes('sue')) {
      return STUDENT_AVATARS.Sue;
    }
    return avatarUrl;
  }

  return STUDENT_AVATARS.Sue;
}

