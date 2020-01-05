import { units, colors } from "../styles";
import React from "react";
import { css } from "emotion";

const fieldInput = css`
  font-size: ${units(4)};
  padding: ${units(1.5)};
  border-width: ${units(0.5)};
  border-style: solid;
  border-color: ${colors.primaryDark};
  transition: all 0.1s;

  &:focus {
    border-color: ${colors.primary};
  }
`;

const fieldLabelContent = css`
  margin-bottom: ${units(1)};
`;

const fieldLabel = css`
  display: block;
  font-size: ${units(4)};
  margin-bottom: ${units(4)};
`;

export function Field({
  children,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={fieldLabel}>
      <div className={fieldLabelContent}>{children}</div>
      <input {...inputProps} className={fieldInput} />
    </label>
  );
}
