import React, { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import './buttonDate.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface ButtonDateProps {
  onRangeChange?: (startDate: Date, endDate: Date) => void;
}


const ButtonDate: React.FC<ButtonDateProps> = ({ onRangeChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);

  const pickerRef = useRef<HTMLDivElement>(null);
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleChange = (item: any) => {
    setRange([item.selection]);
    if (onRangeChange) {
      onRangeChange(item.selection.startDate, item.selection.endDate);
    }
  };

  const formatRange = () => {
    const { startDate, endDate } = range[0];
    return `${format(startDate, 'MMM dd')} – ${format(endDate, 'MMM dd')}`;
  };

  return (
    <div className="button-date-wrapper" ref={pickerRef}>
      <button className="button-date" onClick={() => setShowPicker(!showPicker)}>
        {formatRange()}
      </button>
      {showPicker && (
        <div className="date-picker-dropdown">
          <DateRange
            editableDateInputs={true}
            onChange={handleChange}
            moveRangeOnFirstSelection={false}
            ranges={range}
            rangeColors={['#1EA896']}
          />
        </div>
      )}
    </div>
  );
};

export default ButtonDate;
