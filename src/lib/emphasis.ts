// Job bullets mark the engine systems they name with **double asterisks**, so a
// reader skimming the CV finds them inside the sentence that says what was done
// with them. emphasize() turns the markers into <strong> for set:html; plain()
// drops them where only text fits (the console, which sets textContent).
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const emphasize = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1');
