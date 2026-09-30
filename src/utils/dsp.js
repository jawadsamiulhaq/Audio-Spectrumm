// Offline DSP pipeline: low-pass isolation -> speed/pitch transposition -> normalization.

export function dbToGain(db) {
  return Math.pow(10, db / 20);
}

export function downmixToMono(buffer) {
  if (buffer.numberOfChannels === 1) return buffer;
  const mono = new AudioBuffer({ length: buffer.length, numberOfChannels: 1, sampleRate: buffer.sampleRate });
  const out = mono.getChannelData(0);
  const channels = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) channels.push(buffer.getChannelData(ch));
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels.length; ch++) sum += channels[ch][i];
    out[i] = sum / channels.length;
  }
  return mono;
}

export function findPeakAmplitude(buffer) {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  return peak;
}

export function normalizeBuffer(buffer, targetPeak = 0.92) {
  const peak = findPeakAmplitude(buffer);
  if (peak <= 0 || !isFinite(peak)) return buffer;
  const scale = targetPeak / peak;
  if (Math.abs(scale - 1) < 0.001) return buffer;

  const out = new AudioBuffer({
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    for (let i = 0; i < src.length; i++) dst[i] = src[i] * scale;
  }
  return out;
}

// speed > 1 accelerates playback, raising pitch proportionally (tape-speed style transposition).
export async function processBuffer(sourceBuffer, { lowpassEnabled, cutoffHz, speed, normalize, gainDb }) {
  const sr = sourceBuffer.sampleRate;
  const outLength = Math.max(1, Math.ceil(sourceBuffer.length / speed));
  const offlineCtx = new OfflineAudioContext(sourceBuffer.numberOfChannels, outLength, sr);

  const src = offlineCtx.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = speed;

  let lastNode = src;

  if (lowpassEnabled) {
    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = cutoffHz;
    lowpass.Q.value = 0.707;
    lastNode.connect(lowpass);
    lastNode = lowpass;
  }

  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = dbToGain(gainDb || 0);
  lastNode.connect(gainNode);
  gainNode.connect(offlineCtx.destination);

  src.start(0);
  const rendered = await offlineCtx.startRendering();

  return normalize ? normalizeBuffer(rendered, 0.92) : rendered;
}
