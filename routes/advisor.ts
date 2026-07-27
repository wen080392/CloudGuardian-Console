import { Router } from 'express';
import { generateJarvisReport } from '../services/geminiService';
import { synthesizeSpeech } from '../services/elevenlabsService';

const router = Router();

router.post('/jarvis-report', async (req, res) => {
  try {
    const { context } = req.body;
    
    const reportText = await generateJarvisReport(context);
    
    if (!reportText) {
      return res.status(500).json({ error: 'Failed to generate report text.' });
    }

    const audioBuffer = await synthesizeSpeech(reportText);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Failed to synthesize speech.' });
    }

    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

  } catch (error) {
    console.error('Error generating Jarvis report:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
