export function parseContentDisposition(cd?: string): string | null {
  if (!cd) return null;
  const filenameStarMatch = /filename\*=(?:UTF-8'')?([^;\n\r]+)/i.exec(cd);
  if (filenameStarMatch && filenameStarMatch[1]) {
    try {
      const raw = filenameStarMatch[1].trim().replace(/^"|"$/g, '');
      return decodeURIComponent(raw);
    } catch (e) {
      return filenameStarMatch[1].trim().replace(/^"|"$/g, '');
    }
  }
  const filenameMatch = /filename=([^;\n\r]+)/i.exec(cd);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].trim().replace(/^"|"$/g, '');
  }
  return null;
}

export function openPdfAndPrint(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');
  if (!win) {
    // popup blocked: fallback to download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }

  // try to trigger print in the new tab; retry a few times
  const tryPrint = () => {
    try {
      win.focus();
      win.print();
    } catch (e) {
      setTimeout(tryPrint, 500);
    }
  };
  setTimeout(tryPrint, 500);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default { parseContentDisposition, openPdfAndPrint };
