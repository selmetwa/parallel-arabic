/**
 * Get the default dialect for a user
 * Returns the user's target_dialect if set, otherwise returns 'egyptian-arabic'
 */
export function getDefaultDialect(user: { target_dialect?: string | null } | null | undefined): string {
  if (user?.target_dialect) {
    return user.target_dialect;
  }
  return 'egyptian-arabic';
}

