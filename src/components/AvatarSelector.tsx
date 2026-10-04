import { useState } from 'react';
import { Check, X } from 'lucide-react';

// 12 gaming avatar emojis — mix of male/female/neutral cool characters
export const GAMING_AVATARS = [
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'alien', emoji: '👽', label: 'Alien' },
  { id: 'zombie', emoji: '🧟', label: 'Zombie' },
  { id: 'vampire', emoji: '🧛', label: 'Vampire' },
  { id: 'wizard', emoji: '🧙', label: 'Wizard' },
  { id: 'superhero', emoji: '🦸', label: 'Hero' },
  { id: 'supervillain', emoji: '🦹', label: 'Villain' },
  { id: 'pirate', emoji: '🏴‍☠️', label: 'Pirate' },
  { id: 'detective', emoji: '🕵️', label: 'Detective' },
  { id: 'astronaut', emoji: '👩‍🚀', label: 'Astronaut' },
  { id: 'genie', emoji: '🧞', label: 'Genie' },
];

export function AvatarSelector({
  currentAvatar,
  onSelect,
  onClose,
}: {
  currentAvatar: string | null;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentAvatar);

  const handleSave = () => {
    if (selected) onSelect(selected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass border border-cyan-500/30 rounded-2xl p-6 space-y-4 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Pick Your Avatar</h2>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {GAMING_AVATARS.map((avatar) => {
            const isSelected = selected === avatar.id;
            return (
              <button
                key={avatar.id}
                onClick={() => setSelected(avatar.id)}
                className={`relative aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 active:scale-90 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-ink-800/60 border border-blue-500/20 hover:border-cyan-500/30'
                }`}
              >
                {avatar.emoji}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} className="btn-3d-cyan w-full rounded-xl py-3">
          Save Avatar
        </button>
      </div>
    </div>
  );
}

export function getAvatarEmoji(avatarId: string | null): string {
  if (!avatarId) return '🎮';
  const avatar = GAMING_AVATARS.find((a) => a.id === avatarId);
  return avatar ? avatar.emoji : '🎮';
}
