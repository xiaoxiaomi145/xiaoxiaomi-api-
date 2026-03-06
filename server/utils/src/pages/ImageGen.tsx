import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Image as ImageIcon, Download, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function ImageGen() {
  const { token } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1K');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: size as any
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setImageUrl(`data:image/png;base64,${base64EncodeString}`);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        setError('模型未能生成图像，请尝试修改提示词。');
      }
    } catch (err: any) {
      setError(`生成失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            AI 图像生成
          </h1>
          <p className="text-gray-500 mt-2 font-medium">使用 Gemini 3 Pro 强大的图像生成能力，将您的想象变为现实。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="space-y-5">
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2 gap-1.5">
                  <Wand2 className="w-4 h-4 text-indigo-500" />
                  画面描述 (Prompt)
                </label>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="详细描述您想要生成的图像，例如：一只穿着宇航服的可爱猫咪，在火星表面行走，背景是璀璨的星空，电影级光影，8k分辨率..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none custom-scrollbar"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {['赛博朋克风格', '水彩画', '极简主义', '3D 渲染'].map((tag) => (
                    <button 
                      key={tag}
                      onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                      className="text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">图像尺寸</label>
                <div className="grid grid-cols-3 gap-3">
                  {['1K', '2K', '4K'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        size === s 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full flex justify-center items-center px-6 py-3.5 text-base font-bold rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 正在生成图像...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> 开始生成</>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full min-h-[500px] flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              生成结果
            </h3>
            
            <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50/80 flex justify-center items-center group">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-indigo-400 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="font-medium animate-pulse">AI 正在作画中，请稍候...</p>
                </div>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="AI 生成的图像" className="max-w-full max-h-[600px] object-contain shadow-sm" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <a
                      href={imageUrl}
                      download={`ai-image-${Date.now()}.png`}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      下载高清大图
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-3 text-gray-300" />
                  <p>在左侧输入提示词，点击生成按钮</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
