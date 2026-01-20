
import { GoogleGenAI, Type } from "@google/genai";
import { Device } from "../types";

export const analyzeDeviceStatus = async (devices: Device[]) => {
  // Create a new instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    你是一名物联网系统架构师。请分析以下设备群并提供：
    1. 整体运行状况的总结。
    2. 针对有问题的设备的具体维护建议。
    3. 基于当前状态（如电池电量低、节点离线）的潜在风险分析。
    
    请务必使用简体中文回答。
    
    当前设备群数据：
    ${JSON.stringify(devices, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER, description: "系统健康评分 (0-100)" },
            summary: { type: Type.STRING, description: "中文总结报告" },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  deviceId: { type: Type.STRING },
                  action: { type: Type.STRING, description: "建议执行的操作内容（中文）" },
                  priority: { type: Type.STRING, description: "优先级：高、中、或低" }
                },
                required: ["deviceId", "action", "priority"]
              }
            }
          },
          required: ["healthScore", "summary", "recommendations"]
        }
      }
    });

    // response.text is a getter property, not a method
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};

export const getSmartConfiguration = async (deviceType: string, goal: string) => {
  // Create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const prompt = `请为一台 ${deviceType} 物联网设备提供实现以下目标的最优配置参数：${goal}。请以 JSON 对象形式返回键值对，描述请使用中文。`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    // response.text is a getter property
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Config fetch failed:", error);
    return { error: "无法生成配置。" };
  }
};
