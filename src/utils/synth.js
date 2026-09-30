// Synthesizes clean low-frequency test tones for demoing the infrasound pipeline
// without specialized recording hardware.
export function generateToneBuffer({ frequencyHz, durationSec, sampleRate = 48000, amplitude = 0.85 }) {
  const length = Math.max(1, Math.round(durationSec * sampleRate));
  const buffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
  const data = buffer.getChannelData(0);
  const fadeSamples = Math.min(length / 4, Math.round(sampleRate * 0.05));

  for (let i = 0; i < length; i++) {
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > length - fadeSamples) env = (length - i) / fadeSamples;
    data[i] = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate) * amplitude * env;
  }

  return buffer;
}

export const PRESET_TONES = [
  { label: '3 Hz', frequencyHz: 3 },
  { label: '7 Hz', frequencyHz: 7 },
  { label: '12 Hz', frequencyHz: 12 },
  { label: '18 Hz', frequencyHz: 18 },
];
