document.getElementById('translate-btn').addEventListener('click', translateText);
document.getElementById('copy-btn').addEventListener('click', copyText);
document.getElementById('speak-btn').addEventListener('click', speakText);

async function translateText() {
  const input = document.getElementById('input').value.trim();
  if (!input) {
    alert('Please enter some text!');
    return;
  }

  const source = document.getElementById('source-lang').value;
  const target = document.getElementById('target-lang').value;

  const output = document.getElementById('output');
  output.textContent = 'Translating... ⏳';

  try {
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${source}|${target}`;
    
    if (source === 'auto') {
      url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=auto|${target}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Service error (status: ${response.status})`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed');
    }

    const translated = data.responseData.translatedText;
    output.textContent = translated || '[No translation available]';
  } catch (err) {
    output.textContent = `Error: ${err.message}\n\n(MyMemory free limit reached? Try again tomorrow or add &de=your.email@example.com to increase limit)`;
    console.error(err);
  }
}

function copyText() {
  const text = document.getElementById('output').textContent.trim();
  if (text && !text.includes('...') && !text.includes('Error')) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Copy failed – try manually selecting the text.'));
  } else {
    alert('No translation to copy yet.');
  }
}

function speakText() {
  const text = document.getElementById('output').textContent.trim();
  if (!text || text.includes('...') || text.includes('Error')) {
    alert('No valid translation to speak.');
    return;
  }

  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = document.getElementById('target-lang').value;
    utterance.lang = targetLang;

    // Wait for voices to be loaded (very important in Chrome/Edge)
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();

      // Try to find a male-sounding voice
      let preferredVoice = voices.find(v => 
        v.lang === targetLang && (
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||          // common male in Windows/Edge
          v.name.toLowerCase().includes('microsoft') && !v.name.toLowerCase().includes('zira') && !v.name.toLowerCase().includes('aria') ||
          v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('ravi') ||           // Hindi male example
          v.name.toLowerCase().includes('mohan') ||          // Telugu male example
          v.name.includes('男')                              // some Asian male voices
        )
      );

      // Fallback: any other voice in this language (often the 2nd one is male)
      if (!preferredVoice) {
        preferredVoice = voices
          .filter(v => v.lang === targetLang)
          .sort((a, b) => a.name.localeCompare(b.name))[1] ||  // try second voice
          voices.find(v => v.lang === targetLang);
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Selected voice:', preferredVoice.name, '(', preferredVoice.lang, ')');
      } else {
        console.warn('No voice found for language:', targetLang);
      }

      speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet → wait for event
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  } else {
    alert('Text-to-speech not supported in this browser.');
  }
}