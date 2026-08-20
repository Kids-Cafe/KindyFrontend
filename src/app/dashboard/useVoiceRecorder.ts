import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 마이크 녹음입니다. 화면은 "지금 녹음 중인가"와 입력 크기만 알면 됩니다.
 *
 * 재생(TTS)은 여기 없습니다. 녹음과 재생은 서로를 알아야 하는데(마이크가 열려 있을 때
 * 스피커가 울리면 AI 목소리를 그대로 받아 적습니다) 상태를 둘로 나누면 그 조율을 어디서도
 * 책임지지 않게 됩니다. 재생은 채팅 화면이 직접 들고, 녹음이 시작될 때 멈춥니다.
 */

/** 브라우저마다 낼 수 있는 컨테이너가 달라 지원하는 첫 번째를 씁니다. */
const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

/**
 * 녹음 상한입니다. 서버 multipart 한도(10MB)에는 한참 못 미치지만, 아이가 버튼을 눌러 둔
 * 채 잊어버려도 대화가 계속 굴러가게 하는 쪽이 중요합니다.
 */
const MAX_SECONDS = 20;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * 마이크를 쓸 수 있는 환경인지.
 *
 * `getUserMedia`는 **보안 컨텍스트(HTTPS 또는 localhost)에서만** 정의됩니다. 휴대폰에서
 * `http://192.168.x.x:5173` 같은 LAN 주소로 열면 `undefined`라 그냥 부르면 터집니다.
 * (`@/app/lib/id`가 `crypto.randomUUID`로 같은 함정을 이미 적어 두었습니다.)
 */
export function canRecordAudio(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export interface Recording {
  blob: Blob;
  mimeType: string;
}

export function useVoiceRecorder(options: { onStart?: () => void } = {}) {
  const [recording, setRecording] = useState(false);
  /** 0~1. 파형 막대의 높이입니다. */
  const [level, setLevel] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [denied, setDenied] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef(0);
  const timerRef = useRef(0);
  const resolveRef = useRef<((value: Recording | null) => void) | null>(null);

  const { onStart } = options;

  /** 마이크·분석기·타이머를 전부 놓습니다. 트랙을 멈추지 않으면 브라우저의 마이크 표시등이 계속 켜져 있습니다. */
  const teardown = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    recorderRef.current = null;
    setLevel(0);
    setRecording(false);
  }, []);

  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    // onstop 안에서 teardown이 돌고, 그때 start()가 준 약속이 결과와 함께 풀립니다.
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** 녹음을 시작하고, 끝났을 때의 결과를 약속으로 돌려줍니다. 실패하거나 소리가 없으면 `null`입니다. */
  const start = useCallback(async (): Promise<Recording | null> => {
    if (recorderRef.current) return null;
    if (!canRecordAudio()) return null;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (cause) {
      console.warn("[Kindy] 마이크를 쓸 수 없어요.", cause);
      setDenied(true);
      return null;
    }

    onStart?.();
    streamRef.current = stream;
    setDenied(false);
    setSecondsLeft(MAX_SECONDS);

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      // 20초 녹음을 넉넉히 담으면서 업로드가 가벼운 선입니다.
      audioBitsPerSecond: 32000,
    });
    recorderRef.current = recorder;

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Recording | null>((resolve) => {
      resolveRef.current = resolve;
    });

    recorder.onstop = () => {
      // 요청한 것이 아니라 실제로 쓰인 형식을 봅니다 — Chrome은 `;codecs=opus`를 붙여 돌려줍니다.
      const actual = recorder.mimeType || mimeType || "audio/webm";
      teardown();
      const blob = new Blob(chunks, { type: actual });
      resolveRef.current?.(blob.size > 0 ? { blob, mimeType: actual } : null);
      resolveRef.current = null;
    };

    recorder.start();
    setRecording(true);

    // 실제 입력 크기로 파형을 그립니다.
    try {
      const context = new AudioContext();
      audioContextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(samples);
        let peak = 0;
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128) / 128);
        setLevel(peak);
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // 파형은 곁들이는 것이라, 못 그려도 녹음 자체는 계속합니다.
    }

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((left) => {
        if (left <= 1) {
          stop();
          return 0;
        }
        return left - 1;
      });
    }, 1000);

    return done;
  }, [onStart, stop, teardown]);

  return { recording, level, secondsLeft, denied, start, stop, maxSeconds: MAX_SECONDS };
}
