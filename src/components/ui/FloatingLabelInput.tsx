import React, { useEffect, useState } from "react";
import styles from "@/styles/components/ui/FloatingLabelInput.module.css";

interface Props {
  label: string;
  value: any;
  onChange: (value: string) => void;
  type?: string;
  id?: string;
}

const FloatingLabelInput: React.FC<Props> = ({
  label,
  value,
  onChange,
  type = "text",
  id,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [floatLabel, setFloatLabel] = useState(false);

  useEffect(() => {
    setFloatLabel(isFocused || (value && value?.length > 0));
  }, [value, isFocused]);

  return (
    <div className={styles.inputWrapper}>
      <label
        htmlFor={id}
        className={`${styles.label} ${floatLabel ? styles.labelFloat : ""}`}
      >
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        value={value}
        type={type}
        onFocus={() => {
          setIsFocused(true);
          console.log("focus");
        }}
        onBlur={() => {
          setIsFocused(false);
          console.log("blur");
        }}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default FloatingLabelInput;
