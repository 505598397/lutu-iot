
import React, { useState } from 'react';
import { Device } from '../types';
import { analyzeDeviceStatus } from '../services/geminiService';

interface AIInsightsProps {
  devices: Device[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ devices }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeDeviceStatus(devices);
      setAnalysis(result);
    } catch (err) {
      setError("AI 智能分析生成失败，请检查您的 API Key 是否有效。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-950 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <i className="fas fa-brain text-9xl"></i>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3">系统智能</h2>
          <p className="text-blue-100 dark:text-blue-300 max-w-2xl mb-8">
            利用 Gemini 的高级推理能力分析您的物联网设备群。我们将识别异常、电池风险，并建议主动维护以防止停机。
          </p>
          <button 
            onClick={runDiagnostic}
            disabled={loading}
            className="px-8 py-3 bg-white dark:bg-gray-100 text-blue-700 dark:text-blue-900 rounded-xl font-bold shadow-lg hover:bg-blue-50 dark:hover:bg-white transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch animate-spin"></i> 正在分析设备群...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i> 运行 AI 诊断
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-lg"></i>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-xl border border-[#f0f0f0] dark:border-[#303030] shadow-sm flex flex-col items-center justify-center text-center">
             <div className="relative mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                  <circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    className="text-blue-500"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 * (1 - analysis.healthScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-3xl text-gray-800 dark:text-gray-100">
                  {analysis.healthScore}%
                </div>
             </div>
             <h4 className="font-semibold text-gray-800 dark:text-gray-200">健康指数</h4>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">基于状态与电量评估</p>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-[#1f1f1f] p-6 rounded-xl border border-[#f0f0f0] dark:border-[#303030] shadow-sm">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <i className="fas fa-clipboard-list text-blue-500"></i>
              分析总结
            </h4>
            <div className="prose prose-sm text-gray-600 dark:text-gray-400 max-w-none">
              <p className="leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white dark:bg-[#1f1f1f] p-6 rounded-xl border border-[#f0f0f0] dark:border-[#303030] shadow-sm">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
              <i className="fas fa-tools text-orange-500"></i>
              维护建议
            </h4>
            <div className="space-y-4">
              {analysis.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="flex items-center gap-6 p-4 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] border border-gray-100 dark:border-gray-800 group transition-all hover:border-blue-200 dark:hover:border-blue-900 hover:bg-white dark:hover:bg-[#1f1f1f] hover:shadow-sm">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    rec.priority === '高' || rec.priority === 'High' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 
                    rec.priority === '中' || rec.priority === 'Medium' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                  }`}>
                    <i className={`fas ${rec.priority === '高' || rec.priority === 'High' ? 'fa-fire' : 'fa-wrench'}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{rec.deviceId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        rec.priority === '高' || rec.priority === 'High' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>{rec.priority} 优先级</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.action}</p>
                  </div>
                  <button className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50">
                    立即修复
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="p-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-robot text-4xl text-gray-300 dark:text-gray-600"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-400 dark:text-gray-500">准备好进行智能诊断分析</h3>
          <p className="text-gray-400 dark:text-gray-600 mt-2 max-w-sm">点击上方按钮，开始使用我们的 Gemini 智能引擎处理设备数据。</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
