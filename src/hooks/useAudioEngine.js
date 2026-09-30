import { useCallback, useEffect, useRef, useState } from 'react';
import { processBuffer, downmixToMono } from '../utils/dsp';
import { audioBufferToWavBlob, downloadBlob } from '../utils/wav';

const FFT_SIZE = 32768;

export function useAudioEngine() {
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const recNodesRef = useRef(null);
  const chunksRef = useRef([]);
  const samplesRecordedRef = useRef(0);
  const targetSamplesRef = useRef(Infinity);
  const isRecordingRef = useRef(false);

  const playbackSourceRef = useRef(null);
  const playbackOffsetRef = useRef(0);
  const playbackStartCtxTimeRef = useRef(0);
  const manualStopRef = useRef(false);
  const rafRef = useRef(null);
  const processTokenRef = useRef(0);

  const [error, setError] = useState(null);
  const [sourceBuffer, setSourceBuffer] = useState(null);
  const [sourceLabel, setSourceLabel] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [params, setParams] = useState({
    lowpassEnabled: true,
    cutoffHz: 20,
    speed: 1,
    normalize: true,
    gainDb: 0,
    inputGain: 1,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [targetSec, setTargetSec] = useState(10);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [activeAnalyser, setActiveAnalyser] = useState(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const setParam = useCallback((key, value) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  // ---- Recording ----
  const startRecording = useCallback(
    async ({ scheduled, durationSec }) => {
      setError(null);
      try {
        const ctx = getCtx();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          },
        });
        streamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        const inputGain = ctx.createGain();
        inputGain.gain.value = params.inputGain;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;

        source.connect(inputGain);
        inputGain.connect(analyser);
        inputGain.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(ctx.destination);

        chunksRef.current = [];
        samplesRecordedRef.current = 0;
        targetSamplesRef.current = scheduled ? Math.round(durationSec * ctx.sampleRate) : Infinity;

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          chunksRef.current.push(input.slice());
          samplesRecordedRef.current += input.length;
          setElapsedSec(samplesRecordedRef.current / ctx.sampleRate);
          if (scheduled && samplesRecordedRef.current >= targetSamplesRef.current) {
            stopRecording();
          }
        };

        processorRef.current = processor;
        recNodesRef.current = { source, inputGain, analyser, silentGain };

        setIsScheduled(!!scheduled);
        setTargetSec(durationSec || 10);
        setElapsedSec(0);
        isRecordingRef.current = true;
        setIsRecording(true);
        setActiveAnalyser(analyser);
      } catch (err) {
        setError(err.message || 'Microphone access failed.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getCtx, params.inputGain]
  );

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    const ctx = ctxRef.current;
    const processor = processorRef.current;
    if (processor) {
      processor.onaudioprocess = null;
      processor.disconnect();
    }
    if (recNodesRef.current) {
      const { source, inputGain, analyser, silentGain } = recNodesRef.current;
      try {
        source.disconnect();
        inputGain.disconnect();
        analyser.disconnect();
        silentGain.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const totalLength = chunksRef.current.reduce((sum, c) => sum + c.length, 0);
    if (totalLength > 0 && ctx) {
      const buffer = new AudioBuffer({ length: totalLength, numberOfChannels: 1, sampleRate: ctx.sampleRate });
      const out = buffer.getChannelData(0);
      let offset = 0;
      for (const chunk of chunksRef.current) {
        out.set(chunk, offset);
        offset += chunk.length;
      }
      setSourceBuffer(buffer);
      setSourceLabel(`Microphone recording (${buffer.duration.toFixed(1)}s)`);
      setProcessedBuffer(null);
    }

    chunksRef.current = [];
    setIsRecording(false);
    setActiveAnalyser(null);
  }, []);

  // update live input gain while recording without restarting
  useEffect(() => {
    if (recNodesRef.current) {
      recNodesRef.current.inputGain.gain.value = params.inputGain;
    }
  }, [params.inputGain]);

  // ---- Loading sources ----
  const loadFile = useCallback(
    async (file) => {
      setError(null);
      try {
        const ctx = getCtx();
        const arrayBuffer = await file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        setSourceBuffer(downmixToMono(decoded));
        setSourceLabel(`${file.name} (${decoded.duration.toFixed(1)}s)`);
        setProcessedBuffer(null);
      } catch (err) {
        setError('Could not decode audio file: ' + (err.message || err));
      }
    },
    [getCtx]
  );

  const loadPreset = useCallback((buffer, label) => {
    setError(null);
    setSourceBuffer(buffer);
    setSourceLabel(label);
    setProcessedBuffer(null);
  }, []);

  // ---- Processing pipeline (auto re-run on param/source change) ----
  useEffect(() => {
    if (!sourceBuffer) return;
    const token = ++processTokenRef.current;
    setIsProcessing(true);
    const t = setTimeout(() => {
      processBuffer(sourceBuffer, params)
        .then((result) => {
          if (processTokenRef.current === token) {
            setProcessedBuffer(result);
            setIsProcessing(false);
          }
        })
        .catch((err) => {
          if (processTokenRef.current === token) {
            setError('Processing failed: ' + (err.message || err));
            setIsProcessing(false);
          }
        });
    }, 120);
    return () => clearTimeout(t);
  }, [sourceBuffer, params]);

  const activeBuffer = processedBuffer || sourceBuffer;

  // ---- Playback ----
  const stopRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tickPlayback = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !activeBuffer) return;
    const t = ctx.currentTime - playbackStartCtxTimeRef.current;
    if (isLooping) {
      setCurrentTime(t % activeBuffer.duration);
    } else {
      setCurrentTime(Math.min(t, activeBuffer.duration));
    }
    rafRef.current = requestAnimationFrame(tickPlayback);
  }, [activeBuffer, isLooping]);

  const play = useCallback(() => {
    if (!activeBuffer) return;
    const ctx = getCtx();
    if (playbackSourceRef.current) return; // already playing

    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = activeBuffer;
    bufferSource.loop = isLooping;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    bufferSource.connect(analyser);
    analyser.connect(ctx.destination);

    manualStopRef.current = false;
    bufferSource.onended = () => {
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      playbackSourceRef.current = null;
      setIsPlaying(false);
      setActiveAnalyser(null);
      setCurrentTime(0);
      playbackOffsetRef.current = 0;
      stopRaf();
    };

    const offset = Math.min(playbackOffsetRef.current, activeBuffer.duration - 0.001);
    bufferSource.start(0, Math.max(0, offset));
    playbackStartCtxTimeRef.current = ctx.currentTime - offset;
    playbackSourceRef.current = bufferSource;

    setIsPlaying(true);
    setActiveAnalyser(analyser);
    stopRaf();
    rafRef.current = requestAnimationFrame(tickPlayback);
  }, [activeBuffer, getCtx, isLooping, tickPlayback]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!playbackSourceRef.current || !ctx) return;
    manualStopRef.current = true;
    playbackOffsetRef.current = Math.min(
      Math.max(0, ctx.currentTime - playbackStartCtxTimeRef.current),
      activeBuffer ? activeBuffer.duration : 0
    );
    playbackSourceRef.current.stop();
    playbackSourceRef.current.disconnect();
    playbackSourceRef.current = null;
    setIsPlaying(false);
    setActiveAnalyser(null);
    setCurrentTime(playbackOffsetRef.current);
    stopRaf();
  }, [activeBuffer]);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (playbackSourceRef.current && ctx) {
      manualStopRef.current = true;
      playbackSourceRef.current.stop();
      playbackSourceRef.current.disconnect();
      playbackSourceRef.current = null;
    }
    playbackOffsetRef.current = 0;
    setIsPlaying(false);
    setActiveAnalyser(null);
    setCurrentTime(0);
    stopRaf();
  }, []);

  const seek = useCallback(
    (time) => {
      const duration = activeBuffer ? activeBuffer.duration : 0;
      const clamped = Math.max(0, Math.min(time, duration));
      const wasPlaying = isPlaying;
      if (playbackSourceRef.current) {
        manualStopRef.current = true;
        playbackSourceRef.current.stop();
        playbackSourceRef.current.disconnect();
        playbackSourceRef.current = null;
      }
      playbackOffsetRef.current = clamped;
      setCurrentTime(clamped);
      if (wasPlaying) {
        setTimeout(() => play(), 0);
      }
    },
    [activeBuffer, isPlaying, play]
  );

  const toggleLoop = useCallback(() => {
    setIsLooping((v) => {
      const next = !v;
      if (playbackSourceRef.current) playbackSourceRef.current.loop = next;
      return next;
    });
  }, []);

  // stop playback if the active buffer changes underneath us (reprocessed)
  useEffect(() => {
    if (playbackSourceRef.current) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedBuffer]);

  const exportWav = useCallback(() => {
    if (!activeBuffer) return;
    const blob = audioBufferToWavBlob(activeBuffer);
    downloadBlob(blob, `infrasound-processed-${Date.now()}.wav`);
  }, [activeBuffer]);

  useEffect(() => {
    return () => {
      stopRaf();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    error,
    setError,
    sourceBuffer,
    sourceLabel,
    processedBuffer,
    activeBuffer,
    isProcessing,
    params,
    setParam,
    isRecording,
    isScheduled,
    elapsedSec,
    targetSec,
    startRecording,
    stopRecording,
    loadFile,
    loadPreset,
    isPlaying,
    isLooping,
    currentTime,
    duration: activeBuffer ? activeBuffer.duration : 0,
    play,
    pause,
    stop,
    seek,
    toggleLoop,
    exportWav,
    activeAnalyser,
    sampleRate: activeBuffer ? activeBuffer.sampleRate : ctxRef.current?.sampleRate,
  };
}
