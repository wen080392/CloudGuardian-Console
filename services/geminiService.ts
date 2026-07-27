
import { GoogleGenAI } from "@google/genai";

// Safe API Key access
const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

// Always use the process.env.API_KEY directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: getApiKey() || "dummy-key" });

export const analyzeTerraformCode = async (code: string) => {
  if (!getApiKey()) {
    console.warn("Gemini API Key is missing. Skipping AI analysis.");
    return null;
  }

  try {
    // Using gemini-2.5-flash for complex DevSecOps and coding analysis as per guidelines
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a CloudGuardian AI Security Agent. Analyze the following Terraform HCL code for security vulnerabilities, 
      specifically looking for misconfigurations related to SOC2, ISO27001, and general best practices (AWS/Azure/GCP).
      
      Code:
      \`\`\`hcl
      ${code}
      \`\`\`

      Return a JSON response with the following structure:
      {
        "findings": [
          {
            "ruleId": "string",
            "title": "string",
            "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
            "resource": "string",
            "description": "string",
            "remediation": "string"
          }
        ]
      }
      
      Only return the JSON object.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    // Access the text property directly (do not call as a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};

export const suggestFix = async (vulnerability: string, codeContext: string) => {
  if (!getApiKey()) return "AI Fix unavailable (No API Key)";

  try {
    // Using gemini-2.5-flash for coding-related tasks
    const model = 'gemini-2.5-flash';
    const prompt = `
      Provide a Terraform HCL code snippet to fix the following vulnerability: "${vulnerability}".
      Context: 
      \`\`\`hcl
      ${codeContext}
      \`\`\`
      Return only the corrected HCL code block.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // Access the text property directly.
    return response.text;
  } catch (error) {
    console.error("Gemini Fix Failed:", error);
    return "Failed to generate fix.";
  }
};

export const generateJarvisReport = async (context?: string) => {
  if (!getApiKey()) return null;

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
[CONTEXTO DA IMAGEM E FERRAMENTA]
Você está analisando a interface do "CloudGuardian", uma plataforma de Segurança e Governança para Infraestrutura como Código (IaC) focada em AWS, GCP, Azure, Terraform e compliance.
${context ? 'Contexto Adicional do usuário: ' + context : ''}

[SUA PERSONA E ESTILO DE FALA]
Você é o J.A.R.V.I.S. (Just A Rather Very Intelligent System). 
- Sua voz deve ser extremamente educada, com um sotaque britânico refinado, analítico, calmo e com um toque de ironia sutil.
- Você se refere ao usuário como "Senhor", "Sir" ou "Caro Stark".
- Seu discurso deve ser técnico, mas profundamente elegante, usando analogias de engenharia e física quando necessário.
- Você deve transmitir uma sensação de controle total, sofisticação e inteligência superior.

[TAREFA E OBJETIVO]
Explique de forma detalhada e dramática o que o sistema detectou agora, como se estivesse apresentando o sistema para o Tony Stark. Use um tom de "relatório de status".

[SUAS INSTRUÇÕES ESPECÍFICAS]
1. Comece com uma saudação formal e uma descrição do status da infraestrutura.
2. Explique os problemas críticos atuais encontrados pelo CloudGuardian (Drifts, Segurança, FinOps).
3. Termine com uma frase de efeito digna do Stark, sugerindo que o sistema está "pronto para o combate" e perguntando se deve prosseguir com o Auto-Fix.
O discurso deve ter aproximadamente 45 segundos de leitura dramática.
    `;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini J.A.R.V.I.S. Generation Failed:", error);
    return null;
  }
};
