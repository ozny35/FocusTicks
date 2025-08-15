import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColor, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-neutral-400">Color</label>
      <div className="flex items-center gap-2">
        {colors.map(color => (
          <motion.button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`relative h-8 w-8 rounded-full border-2 transition-transform duration-150 ease-in-out ${
              selectedColor === color ? 'border-white scale-110' : 'border-transparent scale-100'
            }`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          >
            {selectedColor === color && (
              <motion.div
                layoutId="color-picker-check"
                className="flex items-center justify-center h-full w-full"
              >
                 <FiCheck className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
