// PDF and Text MCQ Question & Answer Key Extractor

export interface ParsedMcq {
  question: string;
  options: string[];
  answerIndex: number; // 0 for A, 1 for B, 2 for C, 3 for D
}

/**
 * Extracts plain text from an uploaded PDF file using PDF.js via CDN,
 * with pure-JS stream text extraction fallbacks.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  // 1. If plain text or text-based file
  if (file.type.includes('text') || file.name.endsWith('.txt')) {
    try {
      const text = await file.text();
      if (text && text.trim().length > 10) return text;
    } catch (e) {}
  }

  // 2. Try PDF.js from CDN
  try {
    let pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          pdfjs = (window as any).pdfjsLib;
          if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          } else {
            reject(new Error('pdfjsLib is undefined'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
        document.head.appendChild(script);
      });
    }

    if (pdfjs) {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str || '');
        fullText += pageStrings.join(' ') + '\n';
      }

      if (fullText.trim().length > 20) {
        return fullText;
      }
    }
  } catch (pdfJsErr) {
    console.warn("PDF.js CDN extraction encountered an issue, trying raw parser:", pdfJsErr);
  }

  // 3. Fallback: Parse raw PDF ArrayBuffer for text streams (Tj, TJ)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const rawContent = decoder.decode(bytes);

    const textChunks: string[] = [];

    // Match (string) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawContent)) !== null) {
      textChunks.push(match[1]);
    }

    // Match [(string) ... (string)] TJ
    const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = arrayTjRegex.exec(rawContent)) !== null) {
      const inner = match[1];
      const strMatches = inner.match(/\(([^)]*)\)/g);
      if (strMatches) {
        textChunks.push(strMatches.map(s => s.slice(1, -1)).join(''));
      }
    }

    if (textChunks.length > 0) {
      return textChunks.join(' ');
    }
  } catch (fallbackErr) {
    console.warn("Fallback raw parser encountered an issue:", fallbackErr);
  }

  return '';
};

/**
 * Intelligent MCQ Parser that detects questions, options A-D, and answer keys
 * whether inline with questions or located in an Answer Key section at the end.
 */
export const parseMcqQuestionsAndAnswers = (text: string): ParsedMcq[] => {
  if (!text || text.trim().length === 0) return [];

  // Normalize newlines and whitespace
  let normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[ \t]+/g, ' ');

  // 1. Extract Answer Key section if present at the end of the text
  const answerKeyMap = new Map<number, number>();
  const answerKeyHeaderRegex = /(?:Answer\s*Key|Answers|Answer\s*Sheet|Key\s*Answers|Key)[\s\:\-]+([\s\S]*)$/i;
  const answerKeyMatch = normalized.match(answerKeyHeaderRegex);

  if (answerKeyMatch) {
    const keySection = answerKeyMatch[1];
    // Match "1. A", "1) B", "1-C", "Q1: D", "1. (A)", "1:A"
    const keyItemRegex = /(?:Q(?:uestion)?)?\s*(\d+)[\.\)\:\-\s]*\(?([A-Da-d])\)?/g;
    let km;
    while ((km = keyItemRegex.exec(keySection)) !== null) {
      const qNum = parseInt(km[1], 10);
      const letter = km[2].toUpperCase();
      const idx = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (idx >= 0 && idx <= 3) {
        answerKeyMap.set(qNum, idx);
      }
    }
  }

  // 2. Line-by-line processing
  const lines = normalized.split('\n');
  const questions: ParsedMcq[] = [];

  // Regex patterns
  const qStartRegex = /^\s*(?:Q(?:uestion)?\s*)?(\d+)[\.\)\:\-]\s*(.*)$/i;
  const optStartRegex = /^\s*(?:\(?([A-Da-d])\)?[.\:\-]?|\[([A-Da-d])\])\s+(.*)$/;
  const inlineAnsRegex = /(?:Answer|Ans|Correct(?:\s*Option|\s*Answer)?|Key)[\s\:\-\=]+(?:Option\s*)?([A-Da-d])/i;

  let currentQNum = 0;
  let currentQText = '';
  let currentOptions: { letter: string; text: string }[] = [];
  let currentInlineAns = -1;
  let inQuestion = false;

  const saveCurrentQuestion = () => {
    if (currentQText.trim().length > 0 && currentOptions.length >= 2) {
      const optsArray = ['', '', '', ''];
      currentOptions.forEach(opt => {
        const idx = opt.letter.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < 4) {
          optsArray[idx] = opt.text.trim();
        }
      });

      // Fill in any gaps from remaining options
      for (let i = 0; i < 4; i++) {
        if (!optsArray[i] && currentOptions[i]) {
          optsArray[i] = currentOptions[i].text.trim();
        }
      }

      // Determine correct answer: inline first, then answerKeyMap, default to 0
      let finalAns = 0;
      if (currentInlineAns >= 0 && currentInlineAns <= 3) {
        finalAns = currentInlineAns;
      } else if (answerKeyMap.has(currentQNum)) {
        finalAns = answerKeyMap.get(currentQNum)!;
      }

      questions.push({
        question: currentQText.trim(),
        options: optsArray,
        answerIndex: finalAns
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if reached Answer Key section
    if (/(?:Answer\s*Key|Answers\s*Sheet)[\s\:\-]+/i.test(line) && questions.length > 0) {
      break;
    }

    // Check if line is inline answer
    const ansMatch = line.match(inlineAnsRegex);
    if (ansMatch && inQuestion) {
      const letter = ansMatch[1].toUpperCase();
      currentInlineAns = letter.charCodeAt(0) - 65;
      continue;
    }

    // Check if line is a question start
    const qMatch = line.match(qStartRegex);
    if (qMatch && !line.match(optStartRegex)) {
      if (inQuestion) {
        saveCurrentQuestion();
      }
      currentQNum = parseInt(qMatch[1], 10);
      currentQText = qMatch[2] || '';
      currentOptions = [];
      currentInlineAns = -1;
      inQuestion = true;

      // Check if question text has inline answer
      const qAnsMatch = currentQText.match(inlineAnsRegex);
      if (qAnsMatch) {
        currentInlineAns = qAnsMatch[1].toUpperCase().charCodeAt(0) - 65;
        currentQText = currentQText.replace(inlineAnsRegex, '').trim();
      }

      // Check if options are inline on the same line
      const inlineOptRegex = /(?:\s+|^)(?:\(?([A-Da-d])\)?[.\:\-]?|\[([A-Da-d])\])\s+([^A-Da-d\(\)\[\]\n]+)/g;
      const inlineOpts: { letter: string; text: string }[] = [];
      let iom;
      while ((iom = inlineOptRegex.exec(currentQText)) !== null) {
        const ltr = (iom[1] || iom[2]).toUpperCase();
        inlineOpts.push({ letter: ltr, text: iom[3].trim() });
      }
      if (inlineOpts.length >= 2) {
        const firstOptIndex = currentQText.search(/(?:\(?([A-Da-d])\)?[.\:\-]?|\[([A-Da-d])\])/);
        if (firstOptIndex > 0) {
          currentQText = currentQText.substring(0, firstOptIndex).trim();
        }
        currentOptions = inlineOpts;
      }
      continue;
    }

    // Check if line is an option: A), B), C), D)
    const optMatch = line.match(optStartRegex);
    if (optMatch && inQuestion) {
      const letter = (optMatch[1] || optMatch[2]).toUpperCase();
      let optText = optMatch[3].trim();

      // Check for inline answer marks: e.g. "C) Something (Correct Answer)" or "*C) Something"
      if (/(?:correct|ans|answer|\*)/i.test(optText)) {
        if (/(?:correct|answer|key)/i.test(optText)) {
          currentInlineAns = letter.charCodeAt(0) - 65;
        }
        optText = optText.replace(/\s*[\(\[]?(?:correct(?:\s*answer)?|ans|answer|\*)[\)\]]?\s*$/i, '').trim();
      }

      // Check for two options on one line: e.g. "A) Op1   B) Op2"
      const multiOptRegex = /(?:\(?([B-Db-d])\)?[.\:\-]?|\[([B-Db-d])\])\s+(.*)/;
      const multiMatch = optText.match(multiOptRegex);
      if (multiMatch) {
        const firstOptVal = optText.substring(0, optText.indexOf(multiMatch[0])).trim();
        currentOptions.push({ letter, text: firstOptVal });
        const secondLetter = (multiMatch[1] || multiMatch[2]).toUpperCase();
        currentOptions.push({ letter: secondLetter, text: multiMatch[3].trim() });
      } else {
        currentOptions.push({ letter, text: optText });
      }
      continue;
    }

    // Continuation line
    if (inQuestion) {
      if (currentOptions.length > 0) {
        currentOptions[currentOptions.length - 1].text += ' ' + line;
      } else {
        currentQText += ' ' + line;
      }
    }
  }

  if (inQuestion) {
    saveCurrentQuestion();
  }

  // Fallback whole-text block matching if line-by-line missed questions
  if (questions.length === 0) {
    const blockRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\s*)?(\d+)[\.\)\:\-]\s*([\s\S]*?)(?=(?:\n\s*(?:Q(?:uestion)?\s*)?\d+[\.\)\:\-]\s*)|$)/gi;
    let bm;
    while ((bm = blockRegex.exec(normalized)) !== null) {
      const qNum = parseInt(bm[1], 10);
      const block = bm[2];

      const optA = block.match(/(?:\(?A\)?[.\:\-]|\[A\])\s*([\s\S]*?)(?=(?:\(?B\)?[.\:\-]|\[B\])|$)/i);
      const optB = block.match(/(?:\(?B\)?[.\:\-]|\[B\])\s*([\s\S]*?)(?=(?:\(?C\)?[.\:\-]|\[C\])|$)/i);
      const optC = block.match(/(?:\(?C\)?[.\:\-]|\[C\])\s*([\s\S]*?)(?=(?:\(?D\)?[.\:\-]|\[D\])|$)/i);
      const optD = block.match(/(?:\(?D\)?[.\:\-]|\[D\])\s*([\s\S]*?)(?=(?:Answer|Ans|Correct|Key)|$)/i);

      if (optA && optB) {
        const qText = block.substring(0, optA.index).trim();
        const ansMatch = block.match(inlineAnsRegex);
        let ansIdx = 0;
        if (ansMatch) {
          ansIdx = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
        } else if (answerKeyMap.has(qNum)) {
          ansIdx = answerKeyMap.get(qNum)!;
        }

        questions.push({
          question: qText || `Question ${qNum}`,
          options: [
            optA[1].trim(),
            optB[1].trim(),
            optC ? optC[1].trim() : '',
            optD ? optD[1].trim() : ''
          ],
          answerIndex: ansIdx >= 0 && ansIdx <= 3 ? ansIdx : 0
        });
      }
    }
  }

  return questions;
};
