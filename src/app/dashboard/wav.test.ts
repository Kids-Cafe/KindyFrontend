import { describe, expect, it } from "vitest";
import { TARGET_SAMPLE_RATE, encodeWav, mergeChunks, resampleTo16k, rms } from "@/app/dashboard/wav";

/** 헤더의 리틀엔디언 정수를 읽습니다. */
function u32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}
function u16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}
function text(view: DataView, offset: number, length: number) {
  return Array.from({ length }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join("");
}

/** 사인파 한 토막. 표본율을 바꿔도 소리가 남아 있는지 보려고 씁니다. */
function tone(sampleRate: number, seconds: number, hz = 440) {
  const samples = new Float32Array(Math.round(sampleRate * seconds));
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.sin((2 * Math.PI * hz * i) / sampleRate);
  return samples;
}

/**
 * 서버 STT가 받는 형식은 **16kHz 모노 16bit WAV** 하나뿐입니다. 헤더가 한 칸만 어긋나도
 * 녹음은 멀쩡한데 인식만 조용히 실패하므로, 필드를 하나씩 확인합니다.
 */
describe("encodeWav", () => {
  it("16kHz 모노 16bit PCM 헤더를 씁니다", async () => {
    const blob = encodeWav([tone(TARGET_SAMPLE_RATE, 0.1)], TARGET_SAMPLE_RATE);
    const view = new DataView(await blob.arrayBuffer());

    expect(blob.type).toBe("audio/wav");
    expect(text(view, 0, 4)).toBe("RIFF");
    expect(text(view, 8, 4)).toBe("WAVE");
    expect(text(view, 12, 4)).toBe("fmt ");
    expect(u32(view, 16)).toBe(16);
    expect(u16(view, 20)).toBe(1); // PCM
    expect(u16(view, 22)).toBe(1); // 모노
    expect(u32(view, 24)).toBe(16000);
    expect(u32(view, 28)).toBe(32000); // 초당 바이트 = 16000 × 2
    expect(u16(view, 32)).toBe(2);
    expect(u16(view, 34)).toBe(16);
    expect(text(view, 36, 4)).toBe("data");
  });

  it("길이 필드가 실제 데이터와 맞습니다", async () => {
    const blob = encodeWav([tone(TARGET_SAMPLE_RATE, 0.25)], TARGET_SAMPLE_RATE);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    const dataBytes = u32(view, 40);

    expect(dataBytes).toBe(4000 * 2); // 0.25초 × 16000
    expect(buffer.byteLength).toBe(44 + dataBytes);
    expect(u32(view, 4)).toBe(36 + dataBytes);
  });

  it("48kHz로 열린 마이크도 16kHz로 내려 담습니다", async () => {
    const blob = encodeWav([tone(48000, 1)], 48000);
    const view = new DataView(await blob.arrayBuffer());

    expect(u32(view, 24)).toBe(16000);
    expect(u32(view, 40)).toBe(16000 * 2); // 1초치
  });

  it("조각 여러 개를 순서대로 잇습니다", async () => {
    const chunk = new Float32Array(1600);
    const blob = encodeWav([chunk, chunk, chunk], TARGET_SAMPLE_RATE);
    const view = new DataView(await blob.arrayBuffer());

    expect(u32(view, 40)).toBe(4800 * 2);
  });

  it("범위를 넘는 값은 감싸 돌지 않고 잘립니다", async () => {
    const blob = encodeWav([Float32Array.from([2, -2])], TARGET_SAMPLE_RATE);
    const view = new DataView(await blob.arrayBuffer());

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});

describe("resampleTo16k", () => {
  it("이미 16kHz면 그대로 둡니다", () => {
    const samples = tone(TARGET_SAMPLE_RATE, 0.01);
    expect(resampleTo16k(samples, TARGET_SAMPLE_RATE)).toBe(samples);
  });

  it("내려갈 때도 소리가 남아 있습니다 — 0으로 뭉개지지 않습니다", () => {
    const down = resampleTo16k(tone(48000, 0.5), 48000);
    expect(down.length).toBe(8000);
    // 440Hz는 16kHz로도 충분히 담기는 낮은 음이라 크기가 크게 줄면 안 됩니다.
    expect(rms(down)).toBeGreaterThan(0.5);
  });

  it("8kHz 마이크는 끌어올립니다", () => {
    expect(resampleTo16k(tone(8000, 0.5), 8000).length).toBe(8000);
  });
});

describe("rms", () => {
  it("조용한 조각과 말하는 조각을 크기로 가릅니다", () => {
    expect(rms(new Float32Array(512))).toBe(0);
    expect(rms(tone(TARGET_SAMPLE_RATE, 0.05))).toBeGreaterThan(0.6);
  });
});

describe("mergeChunks", () => {
  it("빈 목록은 빈 결과입니다", () => {
    expect(mergeChunks([]).length).toBe(0);
  });

  it("순서를 지킵니다", () => {
    expect(Array.from(mergeChunks([Float32Array.from([1, 2]), Float32Array.from([3])]))).toEqual([1, 2, 3]);
  });
});
