/** Converts upload errors into short recovery text for the status line. */
export function uploadFailureStatus(error: string): string {
  return error === 'The font file is larger than 5 MB.'
    ? 'That file is over 5 MB. Try a smaller one.'
    : 'That file could not be read as a font.';
}
