import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function ImageGen() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Image Generation</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Image generation feature is currently under development. Check back soon for updates!
        </p>
      </div>
    </div>
  );
}
