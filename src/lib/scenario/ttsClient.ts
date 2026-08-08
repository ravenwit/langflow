import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

const AUDIO_DIR = join(process.cwd(), "public", "audio");
const VOICE_MALE = "de-DE-ConradNeural";
const VOICE_FEMALE = "de-DE-KatjaNeural";
const DEFAULT_VOICE = VOICE_MALE;

export interface TTSResult {
  audioPath: string;
  audioFileRef: string;
}

export async function generateTTSAudio(text: string, speed: number = 1.0): Promise<TTSResult> {
  if (!existsSync(AUDIO_DIR)) {
    mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const filename = `${crypto.randomUUID()}.mp3`;
  const audioPath = join(AUDIO_DIR, filename);
  const audioFileRef = `/audio/${filename}`;

  const ratePercent = Math.round((speed - 1.0) * 100);

  try {
    await execAsync(
      `edge-tts --voice "${DEFAULT_VOICE}" --text="${text.replace(/"/g, '\\"')}" --rate=${ratePercent > 0 ? `+${ratePercent}%` : `${ratePercent}%`} --write-media="${audioPath}"`
    );
    return { audioPath, audioFileRef };
  } catch (error) {
    console.error("TTS generation failed:", error);
    throw new Error(`Failed to generate TTS audio: ${error}`);
  }
}