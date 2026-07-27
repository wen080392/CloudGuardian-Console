import axios from 'axios';

export const synthesizeSpeech = async (text: string): Promise<Buffer | null> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('ELEVENLABS_API_KEY is not set');
    return null;
  }

  // Voice ID for "Adam" (deep, standard voice) or a specific J.A.R.V.I.S clone if you have one.
  // Using a popular default voice (Adam: pNInz6obpgDQGcFmaJcg) for demonstration.
  const voiceId = 'pNInz6obpgDQGcFmaJcg'; 

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('ElevenLabs API Error:', error);
    return null;
  }
};
