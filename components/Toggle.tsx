import React from 'react';

interface ToggleProps {
    on: boolean;
    onChange: () => void;
    label?: string;
}

// Switch per the redesign spec: 46×26 track, 2px dark border,
// knob slides 1px ↔ 21px in 0.15s
const Toggle: React.FC<ToggleProps> = ({ on, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
        className="relative w-[46px] h-[26px] rounded-full border-2 border-[#5e3f28] bg-clip-padding flex-shrink-0 cursor-pointer transition-colors duration-150"
        style={{ backgroundColor: on ? '#D2691E' : '#c3b6a0' }}
    >
        <span
            className="absolute top-[1px] w-5 h-5 rounded-full bg-[#FDF6E3] transition-[left] duration-150"
            style={{ left: on ? 21 : 1 }}
        />
    </button>
);

export default Toggle;
