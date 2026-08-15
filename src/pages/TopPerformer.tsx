import React from 'react';
import { Award } from 'lucide-react';

const TopPerformer: React.FC = () => {
  return (
    <div className="w-full max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-3 text-gray-900 font-bold text-2xl mb-8">
        <Award className="text-orange-500" size={28} /> 
        Top Performer
      </div>
      
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
        <p className="text-gray-500">Top performer board coming soon!</p>
      </div>
    </div>
  );
};

export default TopPerformer;
