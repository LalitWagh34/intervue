interface LastLesson {
  slug: string;
  title: string;
}

export function rememberLesson(userId: string, lesson: LastLesson) {
  try {
    localStorage.setItem(`intervue:last-lesson:${userId}`, JSON.stringify({
      slug: lesson.slug,
      title: lesson.title,
    }));
  } catch {
    // Learning remains available when browser storage is disabled.
  }
}

export function getLastLesson(userId: string): LastLesson | null {
  try {
    const raw = localStorage.getItem(`intervue:last-lesson:${userId}`);
    const lesson = raw ? JSON.parse(raw) : null;
    return typeof lesson?.slug === "string" && lesson.slug &&
      typeof lesson.title === "string" && lesson.title ? lesson : null;
  } catch {
    return null;
  }
}
