export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-500';
    case 'epic': return 'from-purple-500 to-pink-500';
    case 'rare': return 'from-blue-500 to-cyan-500';
    default: return 'from-gray-400 to-gray-500';
  }
};

export const getRarityBorder = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return 'border-yellow-400';
    case 'epic': return 'border-purple-500';
    case 'rare': return 'border-blue-500';
    default: return 'border-gray-400';
  }
};
