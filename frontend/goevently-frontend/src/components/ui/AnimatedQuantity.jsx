import { useEffect, useRef, useState } from "react";

export default function AnimatedQuantity({ value, className = "" }) {
  const previousValueRef = useRef(value);
  const [direction, setDirection] = useState("increase");

  useEffect(() => {
    const previousValue = Number(previousValueRef.current);
    const currentValue = Number(value);

    if (currentValue > previousValue) {
      setDirection("increase");
    } else if (currentValue < previousValue) {
      setDirection("decrease");
    }

    previousValueRef.current = value;
  }, [value]);

  const animationClass =
    direction === "increase"
      ? "quantity-slide-up"
      : "quantity-slide-down";

  return (
    <span
      key={value}
      className={`inline-block tabular-nums ${animationClass} ${className}`}
    >
      {value}
    </span>
  );
}