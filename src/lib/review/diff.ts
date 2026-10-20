export type AddedLine = {
  line: number;
  content: string;
};

/**
 * Returns the lines a unified diff adds, numbered as they appear in the new
 * version of the file. Removed lines don't advance the counter; context lines
 * and added lines do.
 */
export function getAddedLines(patch: string): AddedLine[] {
  const addedLines: AddedLine[] = [];
  let currentLine = 0;

  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);

      if (match) {
        currentLine = Number(match[1]);
      }

      continue;
    }

    if (line.startsWith("+++") || line.startsWith("---")) {
      continue;
    }

    if (line.startsWith("+")) {
      addedLines.push({ line: currentLine, content: line.slice(1) });
      currentLine += 1;
      continue;
    }

    // Removed lines and "\ No newline at end of file" aren't in the new file.
    if (line.startsWith("-") || line.startsWith("\\")) {
      continue;
    }

    currentLine += 1;
  }

  return addedLines;
}
