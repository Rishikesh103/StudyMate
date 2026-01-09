import * as React from "react";

const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <label className={`switch ${className}`}>
      <input type="checkbox" ref={ref} {...props} />
      <span className="slider round"></span>
    </label>
  )
);
Switch.displayName = "Switch";

export { Switch };
