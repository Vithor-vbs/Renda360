declare module 'react-date-range' {
  import * as React from 'react';

  export interface Range {
    startDate: Date;
    endDate: Date;
    key?: string;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange?: (ranges: { selection: Range }) => void;
    moveRangeOnFirstSelection?: boolean;
    editableDateInputs?: boolean;
    months?: number;
    direction?: 'vertical' | 'horizontal';
    className?: string;
    rangeColors?: string[];
  }

  export class DateRange extends React.Component<DateRangeProps> {}
}
